'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  SlackStrategy = require('passport-slack-ponycode').SlackStrategy,
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  passport.use('slack', new SlackStrategy({
    clientID: config.slack.clientID,
    clientSecret: config.slack.clientSecret,
    scope: config.slack.scope
  },
  function (req, token, tokenSecret, profile, done) {
    // Set the provider data and include tokens
    var providerData = profile._json;
    providerData.token = token;
    providerData.tokenSecret = tokenSecret;

    // Create the user OAuth profile
    var providerUserProfile = {
      email: profile._json.email,
      username: profile.username,
      provider: 'slack',
      providerIdentifierField: 'user_id',
      providerData: providerData
    };

    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};
