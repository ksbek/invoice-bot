'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  if (response.result.metadata.intentName === 'Make Invoice Send Yes Confirm') {
    Invoice.findOne({ user: user.id }).populate('user', 'companyName').populate('client').sort({ $natural: -1 }).limit(1).exec(function (err, invoice) {
      if (invoice) {
        var response_speech = response.result.fulfillment.speech;
        response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
        web.chat.postMessage(channel, response_speech);
        // Send transaction email to user
        require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, invoice, user, 1);
      }
    });
  } else if (response.result.metadata.intentName === 'Make Invoice Send No Confirm') {
    Invoice.findOne({ user: user.id }).populate('user', 'companyName').populate('client').sort({ $natural: -1 }).limit(1).exec(function (err, invoice) {
      if (invoice) {
        var response_speech = response.result.fulfillment.speech;
        response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
        web.chat.postMessage(channel, response_speech);
      }
    });
  }
};
