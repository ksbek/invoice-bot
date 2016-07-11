'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');

  var attachment = {
    'fallback': 'Required plain-text summary of the attachment.',
    'color': '#f1d4fc',
    'callback_id': 'confirm_user',
    'attachment_type': 'default',
    'token': 'VOOjorjRck77mNR33HD1Eux4',
    'actions': [
      {
        'name': 'no',
        'text': 'No',
        'type': 'button',
        'value': 'no'
      },
      {
        'name': 'yes',
        'text': 'Yes',
        'type': 'button',
        'value': 'yes',
        'style': 'primary'
      }
    ],
    'action_ts': new Date().getTime() / 1000,
    'message_ts': new Date().getTime() / 1000,
    'footer': 'Nowdue AI',
    'footer_icon': 'https://www.nowdue.ai/modules/core/client/img/i-nowdue.png',
    'ts': new Date().getTime() / 1000
  };

  var data = {
    attachments: [attachment]
  };
  web.chat.postMessage(channel, '@' + user.providerData.user + ' just signed up. Please confirm this user.', data);

};
