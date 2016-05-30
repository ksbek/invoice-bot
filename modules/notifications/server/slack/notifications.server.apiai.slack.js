'use strict';

// Create the notifications configuration
module.exports = function (token, config, isFirst) {
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

  var io = GLOBAL.io;

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
      User.findUserBySlackId(rtm.activeUserId, '', function(user) {
        if (user) {
          var text = "Whoa!!! " + user.companyName + ", it's the future! How nice to finally meet you.";
          text += "I'm ​*Jimmy*​ from Nowdue and I'm super excited about joining your team! I'm really good at creating invoices, tracking payments and chasing up late paying clients. I can also do other simple tasks, like adding customers to your client's list.";
          text += "One of my goals is to help you get paid faster so I hope you don't mind that I take a modern approach to invoicing and like to do things a little different. You will notice Nowdue invoices are uniquely set, by default to be now due from the day it is sent! This means the invoice due date status will appear as now due for a period of ​_7 days_​ before becoming overdue. If you want to extend the due date allowance you can do so by changing the overdue date range from the ​*Invoicing Settings*​.";
          text += "Now, this is super important. To get the absolute most out of Nowdue please connect your Stripe account so you can accept direct payments. Once that's done I'll securely link your invoices with your payment provider so clients to easily pay your invoices. I'll also track and report back to you when they do.";
          text += "Please click to connect ​*Stripe*​";
          text += "To get started, my two main commands are `add client` to log a client and `create invoice` to send an invoice but more on that later. I'm dying to drop you a bomb of ​*must-know*​ ​_knowledge_​. Is that cool with you?";
          rtm.sendMessage(text);
        }
      });
    }
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
            case 'Invoice Lookup':

              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {
                  if (response.result.parameters.name !== '') {
                    rtm.sendMessage(response.result.fulfillment.speech, dm.id);
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
                }
              });
              break;

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
                          "author_name": "Invoice: " + client.companyName,
                          "title": "Invoice amount: $" + response.result.parameters.amount,
                          "text": "Description: " + response.result.parameters.description,
                          "fields": [
                            {
                              "title": "Nowdue allowance: " + user.dueDateAllowance + " days",
                              "value": "Send to: " + client.name + " at " + client.email,
                              "short": false
                            }
                          ],
                          "footer": "Nowdue AI",
                          "footer_icon": "https://nowdue.herokuapp.com/modules/core/client/img/i-nowdue.png",
                          "ts": new Date().getTime() / 1000
                        };

                        var data = {
                          attachments: [attachment]
                        };
                        // rtm.sendMessage(response.result.fulfillment.speech, dm.id, data);

                        web.chat.postMessage(dm.id, response.result.fulfillment.speech, data, function(err, response) {
                          console.log(response);
                        });
                      } else {
                        var context = {
                          "name": "invoice-name-not-found"
                        };
                        var newrequest = apiai.textRequest("invoice-name-not-found", { 'contexts': [context] });
                        newrequest.on('response', function(response) {
                          rtm.sendMessage(response, dm.id);
                        });

                        newrequest.on('error', function(error) {
                          console.log(error);
                          // rtm.sendMessage("Sorry, something went wrong", dm.id);
                        });
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

                        // Check if the confirm parameters have amount
                        if (response.result.parameters.amount !== '') {

                          // Create invoice with confirm parameters
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
                              response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
                              console.log(response_speech);
                              // rtm.sendMessage(response_speech, dm.id);
                              web.chat.postMessage(dm.id, response_speech);
                              console.log(invoice);
                              invoice.client = client;
                              invoice.user = user;

                              // Send invoice created notification to notifications page
                              require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, invoice, user, 1);
                            }
                          });
                        } else {
                          rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                        }
                      } else {
                        var context = {
                          "name": "invoice-name-not-found"
                        };
                        var newrequest = apiai.textRequest("invoice-name-not-found", { 'contexts': [context] });
                        newrequest.on('response', function(response) {
                          rtm.sendMessage(response, dm.id);
                        });

                        newrequest.on('error', function(error) {
                          console.log(error);
                          // rtm.sendMessage("Sorry, something went wrong", dm.id);
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
                  Invoice.findOne({ user: user.id }).populate('user', 'displayName').populate('client').sort({ $natural: -1 }).limit(1).exec(function (err, invoice) {
                    if (invoice) {
                      var response_speech = response.result.fulfillment.speech;
                      // response_speech = response_speech.replace('PAGE LINK', '<' + config.baseUrl + '/invoices/' + invoice._id + '|Invoice ' + invoice.invoice + '>');
                      response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
                      // rtm.sendMessage(response_speech, dm.id);
                      web.chat.postMessage(dm.id, response_speech);
                      // Send transaction email to user
                      require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, invoice, user, 1);
                    }
                  });
                }
              });
              break;

            // Check the slack user confirm no send invoice to client
            case 'Make Invoice Send No Confirm':
              // Send invoice url to slack
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {
                  Invoice.findOne({ user: user.id }).populate('user', 'displayName').populate('client').sort({ $natural: -1 }).limit(1).exec(function (err, invoice) {
                    if (invoice) {
                      var response_speech = response.result.fulfillment.speech;
                      // response_speech = response_speech.replace('PAGE LINK', '<' + config.baseUrl + '/invoices/' + invoice._id + '|Invoice ' + invoice.invoice + '>');
                      response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
                      // rtm.sendMessage(response_speech, dm.id);
                      web.chat.postMessage(dm.id, response_speech);
                    }
                  });
                }
              });
              break;

            case 'Create Client Email':
            case 'Create Client Email Same Name':
              // Check if the slack user exists
              User.findUserBySlackId(message.user, '', function(user) {
                if (user) {

                  // Check if the confirm parameters have business name and email
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
                      "footer": "Nowdue AI",
                      "footer_icon": "https://nowdue.herokuapp.com/modules/core/client/img/i-nowdue.png",
                      "ts": new Date().getTime() / 1000
                    };

                    var data = {
                      attachments: [attachment]
                    };
                    web.chat.postMessage(dm.id, response.result.fulfillment.speech, data);
                  }
                } else {
                  rtm.sendMessage("Sorry, you are not registered", dm.id);
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
                        var response_speech = response.result.fulfillment.speech.replace('PAGE LINK', '<' + config.baseUrl + '/clients/' + client._id + '/edit' + '|' + client.companyName + '>');
                        // rtm.sendMessage(response_speech, dm.id);
                        web.chat.postMessage(dm.id, response_speech);
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
