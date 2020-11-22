require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const logger = require('./logger');
const bookmarkRouter = require('./bookmark/bookmark-router');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');

const app = express();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev'
;

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(validateBearerToken)

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use(bookmarkRouter);

app.use(errorHandler);

module.exports = app;