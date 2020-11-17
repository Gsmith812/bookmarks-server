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


module.exports = bookmarkRouter;