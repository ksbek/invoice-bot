'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Notification = mongoose.model('Notification'),
  apiai = require('apiai'),
  Slack = require('slack-node'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


/**
 * Create a notification
 */
exports.create = function(req, res) {
  var notification = new Notification(req.body);
  notification.user = req.user;

  notification.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(notification);
    }
  });
};

/**
 * Show the current notification
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var notification = req.notification ? req.notification.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  notification.isCurrentUserOwner = req.user && notification.user && notification.user._id.toString() === req.user._id.toString();

  res.jsonp(notification);
};

/**
 * Update a notification
 */
exports.update = function(req, res) {
  var notification = req.notification;

  notification = _.extend(notification, req.body);

  notification.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(notification);
    }
  });
};

/**
 * Delete an notification
 */
exports.delete = function(req, res) {
  var notification = req.notification;

  notification.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(notification);
    }
  });
};

/**
 * List of notifications
 */
exports.list = function(req, res) {
  Notification.find({ user: req.user }).sort('-created').populate('user', 'companyName').exec(function(err, notifications) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(notifications);
    }
  });
};

/**
 * Create an request
 */
exports.sendMessage = function (req, res) {
  /*
  var app = apiai("6375b46d78ac45c1a0813498b1789c46");

  var request = app.textRequest(req.body.text);
  request.on('response', function(response) {
    res.json(response);
  });

  request.on('error', function(error) {
    res.json(error);
  });

  request.end();
  */
  /*
  var token = 'xoxp-36622746837-36616158950-37259947571-0912136ef1';

  var Slack = require('slack-node');

  slack = new Slack(token);

  slack.api('chat.postMessage', {
    text:'hello from nodejs',
    channel:'#general'
  }, function(err, response){
    res.json(err);
  });
  */

  if (req.user.providerData.tokenSecret.incoming_webhook) {
    var webhookUri = req.user.providerData.tokenSecret.incoming_webhook.url;
    var channel = req.user.providerData.tokenSecret.incoming_webhook.channel;
    var slack = new Slack();
    slack.setWebhook(webhookUri);

    slack.webhook({
      channel: channel,
      username: "webhookbot",
      text: req.body.text
    }, function(err, response) {
      res.json(response);
    });
  } else {
    res.json({ message: "No webhook url" });
  }
};
