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
    case 1:
      notification.title = 'A successful request to issue an invoice to a client';
      notification.description = 'Created ' + '<a href="' + config.baseUrl + '/invoices/' + invoice.id + '">INV' + invoice.invoice + '</a>' + ' for ' + '<a href="' + config.baseUrl + '/clients/' + invoice.client.id + '">' + invoice.client.companyName + '</a>' + ' Amount $' + invoice.amountDue.amount;
      slackDescription = 'Created ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> for ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' Amount $' + invoice.amountDue.amount;
      break;
    case 8:
      notification.title = 'Successful integration with Stripe';
      notification.description = 'Succefully connected Stripe.';
      slackDescription = 'Succefully connected Stripe.';
      break;
    case 19:
      notification.title = 'Paid';
      notification.description = 'Totally my fav client. ' + '<a href="' + config.baseUrl + '/clients/' + invoice.client.id + '">' + invoice.client.companyName + '</a> paid ' + '<a href="' + config.baseUrl + '/invoices/' + invoice.id + '">INV' + invoice.invoice + '</a>' + ' $' + invoice.amountDue.amount;
      slackDescription = 'Totally my fav client. ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '> paid ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>' + ' $' + invoice.amountDue.amount;
      break;
  }

  notification.save(function(err, notification) {
    io.emit(user.id + 'notification', {
      type: 'notificationCreated',
      notification: notification
    });

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
