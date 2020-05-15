'use strict';

const { join } = require('path');
const express = require('express');
const hbs = require('hbs');
const connectMongo = require('connect-mongo');
const expressSession = require('express-session');
const logger = require('morgan');
const mongoose = require('mongoose');
const sassMiddleware = require('node-sass-middleware');
const serveFavicon = require('serve-favicon');

const basicAuthenticationDeserializer = require('./middleware/basic-authentication-deserializer');
const bindUserToViewLocals = require('./middleware/bind-user-to-view-locals');

const baseRouter = require('./routes');
const authenticationRouter = require('./routes/authentication');
const channelRouter = require('./routes/channel');

const app = express();

hbs.registerPartials(join(__dirname, 'views/partials'));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(serveFavicon(join(__dirname, 'public/images', 'favicon.ico')));
app.use(
  sassMiddleware({
    src: join(__dirname, 'public'),
    dest: join(__dirname, 'public'),
    outputStyle: process.env.NODE_ENV === 'development' ? 'nested' : 'compressed',
    force: process.env.NODE_ENV === 'development',
    sourceMap: true
  })
);
app.use(express.static(join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      httpOnly: true
      // secure: process.env.NODE_ENV === 'production'
    },
    store: new (connectMongo(expressSession))({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24
    })
  })
);

app.use(basicAuthenticationDeserializer);
app.use(bindUserToViewLocals);

const Channel = require('./models/channel');

app.use('/', baseRouter);
app.use('/channel', channelRouter);
app.use('/authentication', authenticationRouter);

// Catch all error handler

app.use((error, req, res, next) => {
  // console.log('Got to catch all error handler', error);
  res.render('error', { error });
});

module.exports = app;
