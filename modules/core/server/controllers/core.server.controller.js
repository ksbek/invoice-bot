'use strict';

var validator = require('validator');

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {

  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      id: req.user.id,
      companyName: req.user.companyName,
      businessNumber: req.user.businessNumber,
      clientsName: req.user.clientsName,
      phoneNumber: req.user.phoneNumber,
      address: req.user.address,
      website: req.user.website,
      conversationSettings: req.user.conversationSettings,
      currency: req.user.currency,
      tax: req.user.tax,
      dueDateAllowance: req.user.dueDateAllowance,
      plan: req.user.plan,
      integrations: req.user.integrations,
      provider: req.user.provider,
      roles: req.user.roles,
      profileImageURL: req.user.profileImageURL,
      email: req.user.email,
      providerData: req.user.providerData,
      additionalProvidersData: req.user.additionalProvidersData
    };
  }

  res.render('modules/core/server/views/index', {
    user: safeUserObject
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
