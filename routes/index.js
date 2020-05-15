const express = require('express');

const Channel = require('./../models/channel');
const Post = require('./../models/post');

const baseRouter = new express.Router();

baseRouter.get('/', (req, res, next) => {
  let channels;

  Channel.find()
    .then(documents => {
      channels = documents;
      return Post.find().populate('channel creator');
    })
    .then(posts => {
      console.log(posts);
      res.render('home', { channels, posts });
    })
    .catch(error => {
      next(error);
    });
});

module.exports = baseRouter;
