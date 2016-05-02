'use strict';

// Create the notifications configuration
module.exports = function (token, config) {
  var app = require('apiai')(config.apiai.clientAccessToken);

  var RtmClient = require('@slack/client').RtmClient;

  var MemoryDataStore = require('@slack/client').MemoryDataStore;

  var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

  var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

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
    var user = rtm.dataStore.getUserById(message.user);

    var dm = rtm.dataStore.getDMByName(user.name);

    var request = app.textRequest(message.text);

    rtm.sendTyping(dm.id);
    request.on('response', function(response) {
      rtm.sendMessage(response.result.fulfillment.speech, dm.id);
    });

    request.on('error', function(error) {
      rtm.sendMessage('Oops', dm.id);
    });

    request.end();
    console.log(message);
  });
};
