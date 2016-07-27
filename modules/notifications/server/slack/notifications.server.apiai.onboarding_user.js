'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');

  var context = {
    'name': 'onboarding'
  };
  /*
  var newrequest = apiai.textRequest('onboarding', { 'contexts': [context], 'sessionId': user.id });
  newrequest.on('response', function(response) {
    console.log(response);

    var attachment = {
      'fallback': 'You are unable to connect stripe',
      'callback_id': 'onboarding',
      'color': '#e2a5f8',
      'attachment_type': 'default',
      'token': 'VOOjorjRck77mNR33HD1Eux4',
      'actions': [
        {
          'name': 'info',
          'text': 'Learn more',
          'type': 'button',
          'style': 'primary',
          'value': 'Learn more'
        }
      ],
      'response_url': config.baseUrl + '/api/notifications/receiveslackmsg'
    };

    var data = {
      attachments: [attachment]
    };
  */
  var attachment = {
    'fallback': 'User onboarding',
    'callback_id': 'onboarding',
    'color': '#e2a5f8',
    'attachment_type': 'default',
    'token': 'VOOjorjRck77mNR33HD1Eux4',
    'actions': [
      {
        'name': 'info',
        'text': 'Learn more',
        'type': 'button',
        'style': 'danger',
        'value': 'Learn more'
      }
    ],
    'response_url': config.baseUrl + '/api/notifications/receiveslackmsg'
  };

  var data = {
    attachments: [attachment]
  };
  var text = "Whoa!!! @" + user.providerData.user + ", it's the future! ​*Jimmy*​ here, from ​*Nowdue*​. Super excited to finally meet you. I'm not one for boasting, however, straight up... you should know that I'm really good at creating invoices, following payments and tracking revenue. \n\n `1`  To add a new client contact to Nowdue just use the ​*add client*​ command. `add client` \n `2` To create and send an invoice, give the ​*create invoice*​ command a whirl :dizzy: `create invoice`";
  web.chat.postMessage(channel, text, data);
    // rtm.sendMessage(response.result.fulfillment.speech.replace('User_Name', new_user.companyName), dm.id);
  /*
  });

  newrequest.on('error', function(error) {
    console.log(error);
  });

  newrequest.end();
  */
};
