const express = require('express');
const notificationRouter = express.Router();
const authenticate = require('../config/authenticate');
const cors = require('./cors');
const Notifications = require('../models/notifications');


notificationRouter.route('')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Notifications.find({})
      .then(notifications => {
        res.status(200).json(notifications)
      }, err => next(err))
      .catch(err => next(err))
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Notifications.remove({ createdAt: {$lte: req.query.date}})
      .then(resp => {
        res.status(200).json(resp);
      }, err => next(err))
      .catch(err => next(err));
  })

notificationRouter.route('/:notificationId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    if(req.body){
      Notifications.findById(req.params.notificationId)
        .then(notification => {
          if(req.body.seen){
            notification.seen = req.body.seen;
          }
          notification.save()
          .then(notification => {
            res.status(200).json(notification);
          }, err => next(err))
        }, err => next(err))
        .catch(err => next(err));
    } else {
      let err = new Error("No notification status found in the request body");
      err.status = 404;
      next(err);
    }
  });


module.exports = notificationRouter;