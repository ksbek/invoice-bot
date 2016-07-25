'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  _ = require('lodash'),
  qs = require('qs'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  request = require('request'),
  User = mongoose.model('User'),
  Client = mongoose.model('Client'),
  Invoice = mongoose.model('Invoice'),
  async = require('async'),
  crypto = require('crypto');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Signup
 */
exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  // Init user and add missing fields
  var user;
  if (req.body.token) {
    User.findOne({
      accountSetupToken: req.body.token,
      accountSetupTokenExpires: {
        $gt: Date.now()
      }
    }, function (err, existing_user) {
      if (err || !existing_user) {
        return res.status(400).send({ 'message': 'Token is incorrect.' });
      }
      user = _.extend(existing_user, req.body);
      user.updated = Date.now();
      user.integrations.slack = true;
      // Then save the user
      user.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {

          var postData = [{
            "email": user.email,
            "company_name": user.companyName,
            "slack_user": user.providerData.user,
            "slack_team": user.providerData.team,
            "provider": user.provider
          }];

          request.post('https://api.sendgrid.com/v3/contactdb/recipients', {
            headers: {
              'Authorization': 'Bearer ' + config.sendgrid.apiKey
            },
            form: JSON.stringify(postData)
          }, function (error, response, body) {
            if (!error && response.statusCode === 201) {
              var result = JSON.parse(body);
              if (result.persisted_recipients[0]) {
                user.sendgrid_recipient_id = result.persisted_recipients;
                user.save();
              }
            }
          });
          Client.find({ team_id: user.providerData.team_id }).exec(function(err, clients) {
            if (!err && clients.length === 0) {
              Client.createDemo(user, function(client) {
                if (client) {
                  Invoice.createDemo(user, client.id, function(invoice) {
                    console.log("Demo Client&Invoice created");
                  });
                }
              });
            }
          });

          req.login(user, function (err) {
            if (err) {
              res.status(400).send(err);
            } else {
              res.json(user);
            }
          });
        }
      });
    });
  } else {
    user = new User(req.body);
    user.provider = 'local';
    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {

        var postData = [{
          "email": user.email,
          "company_name": user.companyName,
          "provider": user.provider
        }];

        request.post('https://api.sendgrid.com/v3/contactdb/recipients', {
          headers: {
            'Authorization': 'Bearer ' + config.sendgrid.apiKey
          },
          form: JSON.stringify(postData)
        }, function (error, response, body) {
          if (!error && response.statusCode === 201) {
            var result = JSON.parse(body);
            if (result.persisted_recipients[0]) {
              user.sendgrid_recipient_id = result.persisted_recipients;
              user.save();
            }
          }
        });

        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  }
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, redirectURL) {
      // return res.redirect("/authentication/account-setup?slackUserName=" + user.providerData.user + "&companyName=" + user.providerData.team + "&id=" + user.id + "&email=" + user.email + "&currency=" + user.currency);

      if (err) {
        return res.redirect('/?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }

      var bottoken = user.providerData.tokenSecret.bot.bot_access_token;
      var WebClient = require('@slack/client').WebClient;
      var web = new WebClient(bottoken);
      // if (!(user.runningStatus && user.runningStatus.token === token && user.runningStatus.isRunning)) {
      if (user.status === 0) {
        user.status = 2;
        User.findOne({ _id: user.teamManager }, function (err, teamManager) {
          if (teamManager) {
            // require(require('path').resolve("modules/notifications/server/slack/notifications.server.mailer.js"))(config, user, teamManager, 0, 3);
            web.im.list(function(err, response) {
              if (err) {
                console.log(err);
              } else {
                if (response.ok === true) {
                  console.log(response);
                  var dm = response.ims.filter(function(im) {
                    return im.user === teamManager.providerData.user_id;
                  });
                  if (dm.length > 0) {
                    console.log(dm[0]);
                    web.chat.postMessage(dm[0].id, '@' + user.providerData.user + ' just joined our team');
                  }
                }
              }
            });
            var newWeb = new WebClient(user.providerData.tokenSecret.access_token);
            newWeb.im.open(user.providerData.tokenSecret.bot.bot_user_id, function(err, response) {
              if (err) {
                console.log(err);
              } else {
                console.log(response);
                if (response.ok === true) {
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.onboarding_user.js"))('', user, response.channel.id, web, config);
                }
              }
            });
          }
        });
        // return res.redirect('/authentication/pending?token=' + token);
        // require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.slack.js"))(bottoken, config, 1, user);
      } else if (user.status === 1 && !user.runningStatus.isRunning) {
        require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.slack.js"))(bottoken, config, 1, user);
      } else {
        web.im.list(function(err, response) {
          if (err) {
            console.log(err);
          } else {
            if (response.ok === true) {
              console.log(response);
              var dm = response.ims.filter(function(im) {
                return im.user === user.providerData.user_id;
              });
              if (dm.length > 0) {
                console.log(dm[0]);
                if (user.status === 1)
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.onboarding_manager.js"))('', user, dm[0].id, web, config);
                else
                  require(require('path').resolve("modules/notifications/server/slack/notifications.server.apiai.onboarding_user.js"))('', user, dm[0].id, web, config);
              }
            }
          }
        });
      }

      async.waterfall([
        // Generate random token
        function (done) {
          crypto.randomBytes(20, function (err, buffer) {
            var token = buffer.toString('hex');
            done(err, token);
          });
        },
        // Save token to user
        function (token, done) {
          user.accountSetupToken = token;
          user.accountSetupTokenExpires = Date.now() + 3600000; // 1 hour
          user.save(function (err) {
            done(err, token, user);
          });
        },
        function (token, user, done) {
          return res.redirect('/authentication/account-setup?token=' + token);
        }
      ], function (err) {
        if (err) {
          return next(err);
        }
      });

      /*
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }
        return res.redirect('/authentication/account-setup');
      });
      */
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            User.findOne({ provider: 'slack', 'providerData.team_id': user.providerData.team_id, roles: ['user', 'teammanager'] }, function (err, existing_user) {
              if (!existing_user) {
                user.roles = ['user', 'teammanager'];
                user.status = 1;
              } else {
                user.teamManager = existing_user.id;
                user.status = 0;
                user.integrations = existing_user.integrations;
                user.companyName = existing_user.companyName;
                user.currency = existing_user.currency;
                user.tax = existing_user.tax;
                user.includeTaxesOnInvoice = existing_user.includeTaxesOnInvoice;
                user.dueDateAllowance = existing_user.dueDateAllowance;
              }

              user.runningStatus = {};
              user.runningStatus.isRunning = false;
              // And save the user
              user.save(function (err) {
                return done(err, user);
              });
            });
          });
        } else {
          user.providerData = providerUserProfile.providerData;
          user.save(function (err) {
            return done(err, user, '/settings/profile');
          });
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, '/settings/accounts');
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};

/**
 * Account setup GET from token
 */
exports.getUserInfoFromToken = function (req, res) {
  User.findOne({
    accountSetupToken: req.body.token,
    accountSetupTokenExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (err || !user) {
      return res.status(400).send({ 'message': 'Token is incorrect.' });
    }
    user.password = "";
    return res.json(user);
  });
};

exports.authStripe = function (req, res) {
  if (req.user) {
    res.redirect('https://connect.stripe.com/oauth/authorize' + "?" + qs.stringify({
      response_type: "code",
      scope: "read_write",
      client_id: config.stripe.clientID
    }));
  } else {
    return res.redirect('/authentication/signin');
  }
};

exports.stripeCallback = function (req, res) {
  var code = req.query.code;

  // Make /oauth/token endpoint POST request
  request.post({
    url: 'https://connect.stripe.com/oauth/token',
    form: {
      grant_type: "authorization_code",
      client_id: config.stripe.clientID,
      code: code,
      client_secret: config.stripe.apiKey
    }
  }, function(err, r, body) {
    if (err) {
      console.log(err);
      return res.redirect('/');
    }
    var user = req.user;

    if (user) {
      // Merge existing user
      User.find({ provider: 'slack', 'providerData.team_id': user.providerData.team_id, roles: ['user', 'teammanager'] }, function (err, managers) {
        if (!managers) {
          return res.redirect('/');
        } else {
          for (var i = 0; i < managers.length; i ++) {
            managers[i].stripe = JSON.parse(body);
            managers[i].integrations.stripe = true;
            managers[i].save();
          }
          return res.redirect('/');
        }
      });
      require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, null, null, user, 0, 5);
    }
  });
};
