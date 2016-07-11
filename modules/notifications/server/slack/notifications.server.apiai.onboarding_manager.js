'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');

  var context = {
    'name': 'onboarding'
  };

  var newrequest = apiai.textRequest('onboarding', { 'contexts': [context], 'sessionId': user.id });
  newrequest.on('response', function(response) {
    console.log(response);

    var attachment = {
      'text': 'To get started, please connect Stripe to accept online :credit_card: payments!',
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
          'value': 'Learn more'
        },
        {
          'name': 'stripe',
          'text': 'Connect with Stripe',
          'style': 'primary',
          'type': 'button',
          'value': 'Connect with Stripe'
        }
      ],
      'response_url': config.baseUrl + '/api/notifications/receiveslackmsg'
    };

    var data = {
      attachments: [attachment]
    };

    web.chat.postMessage(channel, response.result.fulfillment.speech.replace('@funuser', '@' + user.providerData.user), data, function(err, response) {
      console.log(response);
    });
    // rtm.sendMessage(response.result.fulfillment.speech.replace('User_Name', new_user.companyName), dm.id);
  });

  newrequest.on('error', function(error) {
    console.log(error);
  });

  newrequest.end();
};
