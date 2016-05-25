'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, user) {
  var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    Slack = require('slack-node');

  // Make notification
  var notification = new Notification();
  notification.user = user;
  notification.invoice = invoice;
  notification.client = invoice.client;
  notification.type = 2;
  notification.title = 'Invoice Paid';
  notification.description = '<a href="' + config.baseUrl + '/clients/' + invoice.client.id + '">' + invoice.client.companyName + '</a> Paid Invoice' + '<a href="' + config.baseUrl + '/invoices/' + invoice.id + '">' + invoice.invoice + '</a>' + ', Amount $' + invoice.amountDue.amount;
  notification.save(function(err) {
    if (user.providerData.tokenSecret.incoming_webhook) {
      var webhookUri = user.providerData.tokenSecret.incoming_webhook.url;
      var channel = user.providerData.tokenSecret.incoming_webhook.channel;
      var slack = new Slack();
      slack.setWebhook(webhookUri);

      slack.webhook({
        channel: channel,
        username: "webhookbot",
        text: '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '> Paid Invoice' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|' + invoice.invoice + '>' + ', Amount $' + invoice.amountDue.amount
      }, function(err, response) {
        console.log(response);
      });
    } else {
      console.log("No webhook url");
    }
  });
};
