'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  // Check if the confirm parameters have client name
  if (response.result.parameters.name !== '' && response.result.parameters.email !== '') {
    var attachment = {
      "fallback": "Required plain-text summary of the attachment.",
      "color": "#f1d4fc",
      "author_name": "Client: " + response.result.parameters.name,
      "title": "Contact: " + response.result.parameters.contactname,
      "fields": [
        {
          "value": "Email address: " + response.result.parameters.email,
          "short": false
        }
      ],
      "callback_id": "confirm_client",
      "attachment_type": "default",
      "token": "VOOjorjRck77mNR33HD1Eux4",
      "actions": [
        {
          "name": "no",
          "text": "No",
          "type": "button",
          "value": "no",
          "confirm": {
            "title": "Are you sure?",
            "text": "",
            "ok_text": "Yes",
            "dismiss_text": "No"
          }
        },
        {
          "name": "yes",
          "text": "Looks good",
          "type": "button",
          "value": "yes",
          "style": "primary"
        }
      ],
      "action_ts": new Date().getTime() / 1000,
      "message_ts": new Date().getTime() / 1000,
      "footer": "Nowdue AI",
      "footer_icon": "https://nowdue.herokuapp.com/modules/core/client/img/i-nowdue.png",
      "ts": new Date().getTime() / 1000
    };

    var data = {
      attachments: [attachment]
    };
    web.chat.postMessage(channel, response.result.fulfillment.speech, data);
  }
};
