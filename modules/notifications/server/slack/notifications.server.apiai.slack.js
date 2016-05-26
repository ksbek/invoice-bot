'use strict';

// Create the notifications configuration
module.exports = function (token, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  var RtmClient = require('@slack/client').RtmClient;
  var WebClient = require('@slack/client').WebClient;
  var MemoryDataStore = require('@slack/client').MemoryDataStore;
  var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
  var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

  var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') + config.host + ':' + config.port;

  var io = GLOBAL.io;

  var rtm = new RtmClient(token, {
    // Sets the level of logging we require
    logLevel: 'error',
    // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
    dataStore: new MemoryDataStore(),
    // Boolean indicating whether Slack should automatically reconnect after an error response
    autoReconnect: true,
    // Boolean indicating whether each message should be marked as read or not after it is processed
    autoMark: true
  });

  rtm.start();
  // Wait for the client to connect
  rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {
    // Get the user's name
    var user = rtm.dataStore.getUserById(rtm.activeUserId);

    // Get the team's name
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);

    // Log the slack team name and the bot's name
    console.log('Connected to ' + team.name + ' as ' + user.name);
  });

  rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    console.log(message);
    var user = rtm.dataStore.getUserById(message.user);

    if (!user)
      return;

    var dm = rtm.dataStore.getDMByName(user.name);
    if (dm) {
      rtm.sendTyping(dm.id);

      var request = apiai.textRequest(message.text);

      request.on('response', function(response) {
        console.log(response);

        if (response.result.metadata) {
          switch (response.result.metadata.intentName) {

            case 'Invoice Description':

              // Check if the slack user exists
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {
                  if (response.result.parameters.name !== '') {

                    // Check if user have client
                    Client.findClientByName(response.result.parameters.name, user.id, function(client) {
                      if (client) {
                        var attachment = {
                          "fallback": "Required plain-text summary of the attachment.",
                          "color": "#f1d4fc",
                          "pretext": response.result.fulfillment.speech,
                          "author_name": "Invoice: Intercom",
                          "author_link": "http://flickr.com/bobby/",
                          "author_icon": "http://flickr.com/icons/bobby.jpg",
                          "title": "Invoice amount: $" + response.result.parameters.amount,
                          "text": "Description: Designing new user experience interface",
                          "fields": [
                            {
                              "title": "Nowdue allowance: 7 days",
                              "value": "Send to: " + client.name + " at " + client.email,
                              "short": false
                            }
                          ],
                          "image_url": "http://my-website.com/path/to/image.jpg",
                          "thumb_url": "http://example.com/path/to/thumb.png",
                          "footer": "Nowdue AI",
                          "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                          "ts": Date.now
                        };

                        var data = {
                          type: "message",
                          text: response.result.fulfillment.speech,
                          channel: dm.id,
                          attachments: [attachment]
                        };
                        rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                        // var web = new WebClient(token);

                        // web.chat.postMessage(dm.id, response.result.fulfillment.speech, msgpack, function(err, response) {
                        //  console.log(response);
                        // });
                      }
                    });
                  }
                }
              });
              break;

            // Check the slack user confirm yes for make invoice
            case 'Make Invoice Yes Confirm':
              // Check if the slack user exists
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {

                  // Check if the confirm parameters have client name
                  if (response.result.parameters.name !== '') {

                    // Check if user have client
                    Client.findClientByName(response.result.parameters.name, user.id, function(client) {
                      if (client) {

                        // Check if the confirm paramenters have amount
                        if (response.result.parameters.amount !== '') {

                          // Create invoice with confirm paramenters
                          Invoice.createInvoiceFromSlackBot(user, client.id, response.result.parameters, function(invoice) {
                            if (invoice) {
                              var response_speech = response.result.fulfillment.speech;
                              if (invoice.user.currency === 'AUD') {
                                response_speech.replace('[CurrencySymbol]', 'A$');
                              } else if (invoice.user.currency === 'EURO') {
                                response_speech.replace('[CurrencySymbol]', '€');
                              } else {
                                response_speech.replace('[CurrencySymbol]', '$');
                              }

                              // response_speech = response_speech.replace('INV000', config.baseUrl + '/invoices/' + invoice._id + '|Invoice ' + invoice.invoice + '>');
                              response_speech = response_speech.replace('INV000', config.baseUrl + '/invoices/' + invoice._id);
                              console.log(response_speech);
                              rtm.sendMessage(response_speech, dm.id);
                              console.log(invoice);
                              invoice.client = client;
                              invoice.user = user;

                              // Send invoice created notification to notifications page
                              io.emit(user.id + 'invoiceclient', {
                                type: 'invoiceclient',
                                profileImageURL: user.profileImageURL,
                                username: user.username,
                                user_id: user.id,
                                client_name: client.name,
                                amount: invoice.amountDue.amount,
                                currenty: invoice.amountDue.currency
                              });
                            }
                          });
                        } else {
                          rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                        }
                      } else {
                        request = apiai.textRequest("invoice_name_not_found");
                        request.on('response', function(response) {
                          rtm.sendMessage(response, dm.id);
                        });

                        request.on('error', function(error) {
                          rtm.sendMessage("Sorry, something went wrong", dm.id);
                        });

                      }
                    });
                  } else {
                    rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                  }
                } else {
                  rtm.sendMessage("Sorry, you are not registered", dm.id);
                }
              });
              break;

            // Check the slack user confirm send invoice to client
            case 'Make Invoice Send Yes Confirm':
              // Send invoice url to slack
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {
                  Invoice.find({ user: user.id }).populate('user', 'displayName').populate('client').sort({ $natural: -1 }).limit(1).exec(function (err, invoice) {
                    if (invoice) {
                      var response_speech = response.result.fulfillment.speech;
                      // response_speech = response_speech.replace('PAGE LINK', '<' + config.baseUrl + '/invoices/' + invoice[0]._id + '|Invoice ' + invoice[0].invoice + '>');
                      response_speech = response_speech.replace('PAGE LINK', config.baseUrl + '/invoices/' + invoice[0]._id);
                      rtm.sendMessage(response_speech, dm.id);

                      // Send transaction email to user
                      require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, invoice[0], user, 1);
                    }
                  });
                }
              });
              break;

            // Check the slack user confirm yes for create client
            case 'Create Client Yes Confirm':
              // Check if the slack user exists
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {

                  // Check if the confirm parameters have business name and email
                  if (response.result.parameters.name !== '' && response.result.parameters.email !== '') {

                    // Create Client
                    Client.createClientFromSlackBot(user.id, response.result.parameters, function(client) {
                      console.log(client);
                      if (client) {
                        // var response_speech = response.result.fulfillment.speech.replace('PAGE LINK', '<' + config.baseUrl + '/clients/' + client._id + '/edit |' + client.companyName + '>');
                        var response_speech = response.result.fulfillment.speech.replace('PAGE LINK', config.baseUrl + '/clients/' + client._id + '/edit');
                        rtm.sendMessage(response_speech, dm.id);
                      } else {
                        rtm.sendMessage("Sorry, Something went wrong.", dm.id);
                      }
                    });
                  }
                } else {
                  rtm.sendMessage("Sorry, you are not registered", dm.id);
                }
              });
              break;
            default:
              rtm.sendMessage(response.result.fulfillment.speech, dm.id);
              break;
          }
        }
      });

      request.on('error', function(error) {
        rtm.sendMessage('Oops! Something went wrong', dm.id);
      });

      request.end();
    }
  });
};
