'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, client, user, dueDays, type, callback) {
  var mongoose = require('mongoose'),
    Notification = mongoose.model('Notification'),
    WebClient = require('@slack/client').WebClient,
    Slack = require('slack-node');
  var webhookUri = user.providerData.tokenSecret.incoming_webhook.url;
  var channel = user.providerData.tokenSecret.incoming_webhook.channel;
  var slack = new Slack();

  var slackDescription = '';

  // Make notification
  var notification = new Notification();
  notification.user = user;
  notification.type = type;
  notification.team_id = user.providerData.team_id;
  var sendSlack = false;
  var sendSlackChannel = false;
  switch (type) {
    case 1:
      notification.title = 'A successful request to issue an invoice to a client';
      notification.description = '@' + user.providerData.user + 'created ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a>' + ' for ' + '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a>' + ' Amount $' + invoice.amountDue.amount;
      slackDescription = '@' + user.providerData.user + ' created ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> for ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' Amount ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlackChannel = true;
      break;
    case 2:
      notification.title = 'A successful request to log a new client';
      notification.description = '@' + user.providerData.user + ' created ' + '<a href=\'' + config.baseUrl + '/clients/' + client.id + '\'>' + client.companyName + '</a> to clients';
      slackDescription = '@' + user.providerData.user + ' added ' + '<' + config.baseUrl + '/clients/' + client.id + '|' + client.companyName + '> to clients';
      sendSlackChannel = true;
      break;
    case 3:
      notification.title = 'When default tax has been set or changed';
      notification.description = 'Default invoices set to +' + user.tax + '%.';
      break;
    case 4:
      notification.title = 'When due date allowance has been set or changed';
      notification.description = 'Default due date allowance set to ' + user.dueDateAllowance + ' days.';
      break;
    case 5:
      notification.title = 'Successful integration with Stripe';
      notification.description = 'Succefully connected Stripe.';
      slackDescription = 'Succefully connected Stripe.';
      sendSlackChannel = true;
      break;
    case 6:
      notification.title = 'On ' + dueDays + 'th day - ' + (dueDays - 1) + ' days pasted since orinigal send date';
      notification.description = '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> was sent a friendly reminder that ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> is overdue ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' was sent a friendly reminder that ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> is overdue ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlack = true;
      break;
    case 7:
      notification.title = 'Overdue - ' + dueDays + ' days since orinigal send date';
      notification.description = 'We let <a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> know they are now ' + dueDays + ' days overdue on ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a>';
      slackDescription = 'We let <' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' know they are now ' + dueDays + ' days overdue on ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>';
      sendSlack = true;
      break;
    case 8:
      notification.title = 'Overdue - 21 days since orinigal send date';
      notification.description = '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> are now ' + dueDays + ' days overdue on ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a>. We send them another reminder.';
      slackDescription = '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' are now ' + dueDays + ' days overdue on ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>. We send them another reminder.';
      sendSlack = true;
      break;
    case 9:
      notification.title = 'Overdue - 30 days since orinigal send date';
      notification.description = 'We expressed concern for <a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> to ' + '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a>. We are now moving into ' + dueDays + ' days past due.';
      slackDescription = 'We expressed concern for <' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>' + ' to ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>. We are now moving into ' + dueDays + ' days past due.';
      sendSlack = true;
      break;
    case 10:
      notification.title = 'Overdue - 37 days since orinigal send date';
      notification.description = 'We expressed concern for <a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> to ' + '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a>. Now ' + dueDays + ' days past due.';
      slackDescription = 'We expressed concern for <' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>' + ' to ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>. Now ' + dueDays + ' days past due.';
      sendSlack = true;
      break;
    case 11:
      notification.title = 'Opened a unique link viewing invoice';
      notification.description = '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> opend and viewed ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a>.';
      slackDescription = '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' opend and viewed ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '>.';
      sendSlack = true;
      break;
    case 12:
      notification.title = 'Paid an overdue 14 days past due';
      notification.description = 'Yes. <a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> paid ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = 'Yes. <' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' paid ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlack = true;
      break;
    case 13:
      notification.title = 'Paid an overdue 14 days past due';
      notification.description = 'You won\'t beleive it! <a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> finally paid ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = 'You won\'t beleive it! <' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' finally paid ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlack = true;
      break;
    case 14:
      notification.title = 'Paid';
      notification.description = 'Cha-ching! <a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> paid ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = 'Cha-ching! <' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '>' + ' paid ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlackChannel = true;
      break;
    case 15:
      notification.title = 'When paid on time or early';
      notification.description = 'Totally my fav client. ' + '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> paid ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = 'Totally my fav client. ' + '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '> paid ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlackChannel = true;
      break;
    case 16:
      notification.title = 'Paid on time again 1,2,3';
      notification.description = '<a href=\'' + config.baseUrl + '/clients/' + invoice.client.id + '\'>' + invoice.client.companyName + '</a> are awesome. They paid yet another invoice on time. ' + '<a href=\'' + config.baseUrl + '/invoices/' + invoice.id + '\'>INV' + invoice.invoice + '</a> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      slackDescription = '<' + config.baseUrl + '/clients/' + invoice.client.id + '|' + invoice.client.companyName + '> are awesome. They paid yet another invoice on time. ' + '<' + config.baseUrl + '/invoices/' + invoice.id + '|INV' + invoice.invoice + '> ' + config.currencies[user.currency] + invoice.amountDue.amount;
      sendSlackChannel = true;
      break;
  }
  var web = new WebClient(user.providerData.tokenSecret.bot.bot_access_token);
  notification.save(function(err, notification) {
    // io.emit(user.id + 'notification', {
    //   type: 'notificationCreated',
    //   notification: notification
    // });
    if (err) {
      if (callback) {
        callback(false);
      }
    }
    if (sendSlack) {
      web.im.list(function(err, response) {
        if (err) {
          console.log(err);
          if (callback) {
            callback(false);
          }
        } else {
          if (response.ok === true) {
            var dm = response.ims.filter(function(im) {
              return im.user === user.providerData.user_id;
            });
            if (dm.length > 0) {
              web.chat.postMessage(dm[0].id, slackDescription, function(response) {
                console.log(response);
                if (callback) {
                  callback(true);
                }
              });
            } else {
              if (callback) {
                callback(false);
              }
            }
          } else {
            if (callback) {
              callback(false);
            }
          }
        }
      });
    }
    if (sendSlackChannel) {
      if (webhookUri) {
        slack.setWebhook(webhookUri);
        slack.webhook({
          channel: channel,
          username: 'webhookbot',
          text: slackDescription
        }, function(err, response) {
          if (err) {
            if (callback) {
              callback(false);
            }
          } else {
            if (callback) {
              callback(true);
            }
          }
        });
      } else {
        console.log('No webhook url');
        if (callback) {
          callback(false);
        }
      }
    }
  });
};
