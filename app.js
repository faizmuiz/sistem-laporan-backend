const dotenv = require("dotenv").config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require("cors");
const bodyParser = require("body-parser");
const datetimeHeader = require('./middleware/header-datetime-utc')

const { urlValidation, handleErrors }  = require("./exception");

// define route
const indexRouter = require('./route/index');
// const otherStatusRouter = require('./route/other.route');
 // test

const app = express();

// setting cors
const corsOptions = {
    // origin: "http://localhost:3000", // ini nanti di setting
    origin: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Content-Type-Options",
        "X-XSS-Protection",
        "X-Frame-Options",
        "Strict-Transport-Security",
        "APIKey",
        'x-api-key',
        'x-payload',
        'timezone',
        'utc-offset'
    ],
    maxAge: 86400,
    credentials: true,
}

app.use(cors(corsOptions));
app.use(logger('dev'));

// setting max size payload (set max 10mb)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// use middleware for adding datetime UTC from req
app.use(datetimeHeader);

// routing
app.use('/', indexRouter);
// app.use('/other', otherStatusRouter); 
// test

// error handler
app.use(urlValidation);
app.use(handleErrors);

module.exports = app;
