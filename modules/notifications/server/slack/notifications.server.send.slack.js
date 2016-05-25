'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, user, type) {
  var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    Slack = require('slack-node');

  var webhookUri = user.providerData.tokenSecret.incoming_webhook.url;
  var channel = user.providerData.tokenSecret.incoming_webhook.channel;
  var slack = new Slack();

  var slackDescription = "";
  // Make notification
  var notification = new Notification();
  notification.user = user;
  notification.type = type;

  switch (type) {
    case 8:
      notification.title = 'Successful integration with Stripe';
      notification.description = 'Succefully connected Stripe.';
      slackDescription = 'Succefully connected Stripe.';
      break;
    case 19:
      notification.title = 'Paid';
      notification.description = '<a href="' + config.baseUrl + '/clients/' + invoice.client.id + '">' + invoice.client.companyName + '</a> Paid Invoice' + '<a href="' + config.baseUrl + '/invoices/' + invoice.id + '">' + invoice.invoice + '</a>' + ', Amount $' + invoice.amountDue.amount;
      slackDescription = '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '> Paid Invoice' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|' + invoice.invoice + '>' + ', Amount $' + invoice.amountDue.amount;
      break;
  }

  notification.save(function(err) {
    if (webhookUri) {
      slack.setWebhook(webhookUri);
      slack.webhook({
        channel: channel,
        username: "webhookbot",
        text: slackDescription
      }, function(err, response) {
        console.log(response);
      });
    } else {
      console.log("No webhook url");
    }
  });
};
