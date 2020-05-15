const express = require('express');

const Channel = require('./../models/channel');
const Post = require('./../models/post');
const Comment = require('./../models/comment');

const routeGuard = require('./../middleware/route-guard');

const channelRouter = new express.Router();

channelRouter.get('/create', routeGuard, (req, res) => {
  res.render('channel/create');
});

channelRouter.post('/create', routeGuard, (req, res, next) => {
  const name = req.body.name;

  Channel.findOne({ name })
    .then(document => {
      if (!document) {
        return Channel.create({
          name
        });
      } else {
        const error = new Error("There's already a channel with that name.");
        return Promise.reject(error);
      }
    })
    .then(channel => {
      const id = channel._id;
      res.redirect('/channel/' + id);
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.get('/:channelId', (req, res, next) => {
  const channelId = req.params.channelId;

  let posts;

  Post.find({
    channel: channelId
  })
    .populate('channel creator')
    .then(result => {
      posts = result;
      return Channel.findById(channelId);
    })
    .then(channel => {
      res.render('channel/single', { channel, posts });
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.get('/:channelId/post/create', routeGuard, (req, res) => {
  res.render('channel/post/create');
});

channelRouter.post('/:channelId/post/create', routeGuard, (req, res, next) => {
  const channelId = req.params.channelId;

  const title = req.body.title;
  const message = req.body.message;

  return Post.create({
    title,
    message,
    channel: channelId,
    creator: req.user._id
  })
    .then(post => {
      console.log(post);
      res.redirect(`/channel/${channelId}/post/${post._id}`);
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.get('/:channelId/post/:postId', (req, res, next) => {
  const postId = req.params.postId;

  let post;

  Post.findById(postId)
    .then(document => {
      post = document.toObject();
      if (req.user && post.creator.toString() === req.user._id.toString()) {
        post.isOwner = true;
      }
      return Comment.find({ post: postId }).populate('creator');
    })
    .then(comments => {
      res.render('channel/post/single', { post, comments });
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.get('/:channelId/post/:postId/edit', routeGuard, (req, res, next) => {
  const postId = req.params.postId;

  Post.findOne({
    _id: postId,
    creator: req.user._id
  })
    .then(post => {
      res.render('channel/post/edit', { post });
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.post('/:channelId/post/:postId/edit', routeGuard, (req, res, next) => {
  const channelId = req.params.channelId;
  const postId = req.params.postId;

  const title = req.body.title;
  const message = req.body.message;

  Post.findOneAndUpdate(
    {
      _id: postId,
      creator: req.user._id
    },
    {
      title,
      message
    }
  )
    .then(post => {
      res.redirect(`/channel/${channelId}/post/${postId}`);
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.post('/:channelId/post/:postId/delete', routeGuard, (req, res, next) => {
  const postId = req.params.postId;

  Post.findOneAndDelete({
    _id: postId,
    creator: req.user._id
  })
    .then(() => {
      res.redirect(`/`);
    })
    .catch(error => {
      next(error);
    });
});

channelRouter.post('/:channelId/post/:postId/comment', routeGuard, (req, res, next) => {
  const postId = req.params.postId;
  const channelId = req.params.channelId;

  const content = req.body.content;

  Comment.create({
    content,
    creator: req.user._id,
    post: postId
  })
    .then(() => {
      res.redirect(`/channel/${channelId}/post/${postId}`);
    })
    .catch(error => {
      next(error);
    });
});

module.exports = channelRouter;
