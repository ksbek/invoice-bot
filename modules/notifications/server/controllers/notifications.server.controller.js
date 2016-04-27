'use strict';

/**
 * Module dependencies
 */
var apiai = require('apiai'),
  Slack = require('slack-node'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

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

  var webhookUri = "https://hooks.slack.com/services/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";

  var slack = new Slack();
  slack.setWebhook(webhookUri);

  slack.webhook({
    channel: "#general",
    username: "webhookbot",
    text: req.body.text
  }, function(err, response) {
    res.json(response);
  });
};
