'use strict';

// Create the notifications configuration
module.exports = function (token, config, isFirst, new_user) {
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

  var web = new WebClient(token);

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

    if (isFirst === 1) {
      if (new_user) {
        var dm = rtm.dataStore.getDMByName(new_user.providerData.user);

        var context = {
          "name": "onboarding"
        };

        var newrequest = apiai.textRequest('onboarding', { 'contexts': [context] });
        newrequest.on('response', function(response) {
          console.log(response);

          var attachment = {
            "text": "To get started, please connect Stripe to accept online :credit_card: payments!",
            "fallback": "You are unable to connect stripe",
            "callback_id": "stripe",
            "color": "#e2a5f8",
            "attachment_type": "default",
            "token": "VOOjorjRck77mNR33HD1Eux4",
            "actions": [
              {
                "name": "info",
                "text": "Learn more",
                "type": "button",
                "value": "info"
              },
              {
                "name": "stripe",
                "text": "Connect with Stripe",
                "style": "danger",
                "type": "button",
                "value": "stripe",
                "confirm": {
                  "title": "Are you sure?",
                  "text": "",
                  "ok_text": "Yes",
                  "dismiss_text": "No"
                }
              }
            ],
            "response_url": config.baseUrl + "/api/notifications/receiveslackmsg"
          };

          var data = {
            attachments: [attachment]
          };

          web.chat.postMessage(dm.id, response.result.fulfillment.speech.replace('$funuser', new_user.companyName), data, function(err, response) {
            console.log(response);
          });
          // rtm.sendMessage(response.result.fulfillment.speech.replace('User_Name', new_user.companyName), dm.id);
        });

        newrequest.on('error', function(error) {
          console.log(error);
        });

        newrequest.end();
        isFirst = 0;
      }
    }
  });

  rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    var user = rtm.dataStore.getUserById(message.user);

    if (!user)
      return;

    var dm = rtm.dataStore.getDMByName(user.name);
    if (message.subtype === 'bot_add')
      return;

    console.log(message);

    if (dm) {
      // rtm.sendTyping(dm.id);
      User.findUserBySlackId(message.user, '', function(user) {
        if (user) {
          var request = apiai.textRequest(message.text);

          request.on('response', function(response) {
            console.log(response);

            if (response.result.metadata) {
              switch (response.result.metadata.intentName) {
                case 'Invoice Lookup':
                  if (response.result.parameters.name !== '') {
                    // rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                    // Check if user have client
                    Client.findClientByName(response.result.parameters.name, user.id, function(client) {
                      var context = {};
                      if (client) {
                        context = {
                          "name": "invoice-name"
                        };
                      } else {
                        context = {
                          "name": "invoice-name-not-found"
                        };
                      }
                      var newrequest = apiai.textRequest(response.result.parameters.name, { 'contexts': [context] });
                      newrequest.on('response', function(response) {
                        // rtm.sendMessage("asDF", dm.id);
                        console.log(response);
                        rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                      });

                      newrequest.on('error', function(error) {
                        console.log(error);
                        // rtm.sendMessage("Sorry, something went wrong", dm.id);
                      });

                      newrequest.end();
                    });
                  }
                  break;

                case 'Invoice Description':
                case 'Make Invoice No Confirm Wrong Description Given':
                case 'Make Invoice No Confirm Wrong Name Given':
                case 'Make Invoice No Confirm Wrong Amount Given':
                case 'Make Invoice with Name, Amount & Description':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.confirm_invoice.js"))(response, user, dm.id, web, config);
                  break;

                // Check the slack user confirm yes for make invoice
                case 'Make Invoice Yes Confirm':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.create_invoice.js"))(response, user, dm.id, web, config);
                  break;

                // Check the slack user confirm send invoice to client
                case 'Make Invoice Send Yes Confirm':
                case 'Make Invoice Send No Confirm':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.send_invoice.js"))(response, user, dm.id, web, config);
                  break;

                case 'Create Client Business Name':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.create_client_business_name.js"))(response, user, dm.id, web, config);
                  break;

                case 'Create Client Email':
                case 'Create Client Email Same Name':
                case 'Create Client No Confirm Wrong Email Given':
                case 'Create Client No Confirm Wrong Business Name Given':
                case 'Create Client No Confirm Wrong Contact Name Given':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.confirm_client.js"))(response, user, dm.id, web, config);
                  break;

                // Check the slack user confirm yes for create client
                case 'Create Client Yes Confirm':
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.create_client.js"))(response, user, dm.id, web, config);
                  break;

                case 'Lookup Revenue Client':
                  // Check if user have client
                  Client.findClientByName(response.result.parameters.clientname, user.id, function(client) {
                    if (client) {
                      console.log(client);
                      Invoice.aggregate([
                        {
                          $match: {
                            client: client._id
                          }
                        },
                        {
                          $group: {
                            _id: { month: { $month: "$dateDue" }, year: { $year: "$dateDue" } },
                            totalAmount: { $sum: "$amountDue.amount" }
                          }
                        },
                        {
                          $sort: {
                            totalAmount: -1
                          }
                        }
                      ], function(err, result) {
                        if (err) {
                          console.log(err);
                          rtm.sendMessage("Sorry, Something went wrong.", dm.id);
                        } else {
                          console.log(result);
                          var text = "";
                          for (var i = 0; i < result.length; i++) {
                            text += result[i]._id.month + ", " + result[i]._id.year + " " + result[i].totalAmount + "\n";
                          }
                          rtm.sendMessage(text, dm.id);
                        }
                      });
                    } else {
                      rtm.sendMessage("Sorry, No client.", dm.id);
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
        } else {
          rtm.sendMessage("Oh, before we start. It looks like you haven't finished setting up your account. Please go to Nowdue and complete your registration. Also, don't forget connect your Stripe account once registration is complete", dm.id);
        }
      });
    }
  });
};
