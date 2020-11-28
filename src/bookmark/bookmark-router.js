const path = require('path');
const express = require('express');
const xss = require('xss');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');
const BookmarkService = require('./bookmark-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    rating: Number(bookmark.rating),
    url: bookmark.url,
    description: xss(bookmark.description),
})

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarkService.getAllBookmarks(knexInstance)
        .then(bookmarks => res.json(bookmarks.map(serializeBookmark)))
        .catch(next);
    })
    .post(bodyParser, (req, res, next) => {
        const { title, rating, url, description = '' } = req.body;
        //validate the data is present
        for (const field of ['title', 'url', 'rating']) {
            if(!req.body[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required`}
                })
            }
        }
        //validate rating is a number between 1 and 5
        const ratingNum = Number(rating)
        if(!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            logger.error(`Rating must be a number between 1 and 5`)
            return res.status(400).json({
                error: { message: `'rating' must be a number between 1 and 5`}
            })
        }
        //after validation create bookmark object
        const newBookmark = { title, url, description, rating };

        BookmarkService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res
                    .status(201)
                    .location(`/api/bookmarks/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    });

    bookmarkRouter
        .route('/bookmarks/:id')
        .all((req, res, next) => {
            const { id } = req.params;
            const knexInstance = req.app.get('db');
            BookmarkService.getById(knexInstance, id)
                .then(bookmark => {
                    if(!bookmark) {
                        logger.error(`Bookmark with id ${id} not found.`);
                        return res
                            .status(404)
                            .json({
                                error: { message: `Bookmark Not Found` }
                            });
                    }
                    res.bookmark = bookmark
                    next();
                })
                .catch(next);
        })
        .get((req, res) => {
            res.json(serializeBookmark(res.bookmark))
        })
        .delete((req, res, next) => {
            const { id } = req.params;
            
            BookmarkService.deleteBookmark(
                req.app.get('db'),
                id
            )
                
                .then(numRowsAffected => {
                    logger.info(`Bookmark with id ${id} deleted.`)
                    res.status(204).end();
                })
                .catch(next);
        })
        .patch(bodyParser, (req, res, next) => {
            const { title, url, rating, description } = req.body;
            const bookmarkToUpdate = { title, url, rating, description};

            const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
            if(numberOfValues === 0) {
                return res.status(400).json({
                    error: {
                        message: `Request body must contain either 'title', 'url', 'rating', or 'description'`
                    }
                })
            }

            BookmarkService.updateBookmark(
                req.app.get('db'),
                req.params.id,
                bookmarkToUpdate
            )
                .then(numRowsAffected => {
                    res.status(204).end();
                })
                .catch(next);
        })


module.exports = bookmarkRouter;