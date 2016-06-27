'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Notification = mongoose.model('Notification'),
  User = mongoose.model('User'),
  apiai = require('apiai'),
  Slack = require('slack-node'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
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
  var token = req.user.providerData.tokenSecret.access_token;

  var slack = new Slack(token);

  slack.api('users.info', {
    user: req.user.providerData.tokenSecret.bot.bot_user_id
  }, function(err, response) {
    if (err) {
      res.status(400).send({
        message: err
      });
    } else {
      console.log(response);
      if (response.user) {
        slack.api('chat.postMessage', {
          text: req.body.text,
          channel: '@' + response.user.name,
          as_user: req.user.providerData.user
        }, function(err, response) {
          res.json(response);
        });
      } else {
        res.status(400).send({
          message: "User not found"
        });
      }
    }
  });
/*
  if (req.user.providerData.tokenSecret.incoming_webhook) {
    var webhookUri = req.user.providerData.tokenSecret.incoming_webhook.url;
    var slack = new Slack();
    slack.setWebhook(webhookUri);

    slack.webhook({
      channel: '@nowdueasd',
      username: req.user.providerData.user,
      as_user: true,
      text: req.body.text
    }, function(err, response) {
      res.json(response);
    });
  } else {
    res.json({ message: "No webhook url" });
  }
  */
};

/**
 * Get slack button msg
 */
exports.receiveSlackMsg = function (req, res) {
  var params = JSON.parse(req.body.payload);

  var attachment = params.original_message.attachments[0];
  delete attachment.actions;

  var searchQuery = {};
  searchQuery.provider = 'slack';
  searchQuery['providerData.user_id'] = params.user.id;

  var WebClient = require('@slack/client').WebClient;

  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var request;
  var data;

  User.findOne(searchQuery, function (err, user) {
    if (err) {
      console.log(err);
      res.json({ message: 'Something went wrong.' });
    } else {
      var web = new WebClient(user.providerData.tokenSecret.access_token);
      switch (params.callback_id) {

        case 'confirm_invoice':
          if (params.actions[0].value === "yes")
            attachment.fields.push({
              'title': ':ok_hand: You confirmed as correct'
            });
          else
            attachment.fields.push({
              'title': ':confused: You marked as incorrect'
            });

          request = apiai.textRequest(params.actions[0].value);

          request.on('response', function(response) {
            if (params.actions[0].value === "yes")
              require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.create_invoice.js"))(response, user, params.channel.id, web, config);
            else
              web.chat.postMessage(params.channel.id, response.result.fulfillment.speech);
            console.log(response);
          });

          request.on('error', function(error) {
            console.log(error);
          });

          request.end();

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        case 'invoice_created':
          if (params.actions[0].value === "yes")
            attachment.text = ':stuck_out_tongue_winking_eye: You approved';
          else
            attachment.text = ':+1: You marked as send later';

          request = apiai.textRequest(params.actions[0].value);

          request.on('response', function(response) {
            require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.send_invoice.js"))(response, user, params.channel.id, web, config);
            console.log(response);
          });

          request.on('error', function(error) {
            console.log(error);
          });

          request.end();

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        case 'create_client_business_name':
          if (params.actions[0].value === "yes")
            attachment.text = 'Same Name';
          else
            attachment.text = 'New Contact Name';
          request = apiai.textRequest(params.actions[0].value);

          request.on('response', function(response) {
            web.chat.postMessage(params.channel.id, response.result.fulfillment.speech);
            console.log(response);
          });

          request.on('error', function(error) {
            console.log(error);
          });

          request.end();

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        case 'confirm_client':
          if (params.actions[0].value === "yes")
            attachment.fields.push({
              'title': ':ok_hand: You confirmed as correct'
            });
          else {
            attachment.callback_id = 'create_client_no_confirm';
            attachment.actions = [
              {
                "name": "bussiness_name",
                "text": "Business Name",
                "type": "button",
                "value": "Business Name"
              },
              {
                "name": "contact_name",
                "text": "Contact Name",
                "type": "button",
                "value": "Contact Name"
              },
              {
                "name": "email",
                "text": "Email",
                "type": "button",
                "value": "Email"
              }
            ];
          }
          request = apiai.textRequest(params.actions[0].value);

          request.on('response', function(response) {
            if (params.actions[0].value === "yes")
              require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.create_client.js"))(response, user, params.channel.id, web, config);
            else
              web.chat.postMessage(params.channel.id, response.result.fulfillment.speech);
            console.log(response);
          });

          request.on('error', function(error) {
            console.log(error);
          });

          request.end();

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        case 'create_client_no_confirm':
          attachment.fields.push({
            'title': 'Change' + params.actions[0].value
          });

          request = apiai.textRequest(params.actions[0].value);

          request.on('response', function(response) {
            web.chat.postMessage(params.channel.id, response.result.fulfillment.speech);
            console.log(response);
          });

          request.on('error', function(error) {
            console.log(error);
          });

          request.end();

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        case 'onboarding':
          if (params.actions[0].value === 'Learn More')
            attachment.fields.push({
              'title': params.actions[0].value
            });
          else
            attachment.fields.push({
              'title': 'Please click ' + config.baseUrl + '/api/auth/stripe' + ' to connect with stripe'
            });

          if (params.actions[0].value === 'Learn More') {
            request = apiai.textRequest('yes');

            request.on('response', function(response) {
              web.chat.postMessage(params.channel.id, response.result.fulfillment.speech);
              console.log(response);
            });

            request.on('error', function(error) {
              console.log(error);
            });

            request.end();
          }

          console.log(attachment);

          data = {
            text: params.original_message.text,
            attachments: [attachment]
          };
          return res.json(data);

        default:
          res.json({ message: "Ok" });
          break;
      }
    }
  });
};
