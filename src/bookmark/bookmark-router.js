const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, rating, url, description = '' } = req.body;
        //validate the data is present
        if(!title) {
            logger.error(`Title is required`);
            return res
                .status(400)
                .send('Invalid data');
        }
        if(!rating) {
            logger.error(`Rating is required`);
            return res
                .status(400)
                .send('Invalid data');
        }
        if(!url) {
            logger.error(`URL is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        //after validation create bookmark object

        const id = uuid();

        const bookmark = {
            id,
            title,
            rating,
            url,
            description
        };

        bookmarks.push(bookmark);
        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmark);

    });

    bookmarkRouter
        .route('/bookmarks/:id')
        .get((req, res) => {
            const { id } = req.params;
            const bookmark = bookmarks.find(bookmark => bookmark.id == id);
            //validate bookmark actually exists in current array
            if(!bookmark) {
                logger.error(`Bookmark with id ${id} not found.`);
                return res
                    .status(404)
                    .send('Bookmark not found');
            }

            res.json(bookmark);
        })
        .delete((req, res) => {
            const { id } = req.params;
            const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id == id);
            //validate that bookmark actually exists in current array
            if(bookmarkIndex === -1) {
                logger.error(`Bookmark with id ${id} not found.`);
                return res
                    .status(404)
                    .send('Bookmark not found');
            }

            //remove the bookmark object from the array
            bookmarks.splice(bookmarkIndex, 1);

            logger.info(`Bookmark with id ${id} deleted.`);

            res
                .status(204)
                .end();
        });


module.exports = bookmarkRouter;