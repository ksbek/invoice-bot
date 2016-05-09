'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Invoices Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/invoices',
      permissions: '*'
    }, {
      resources: '/api/invoices/:invoiceId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/invoices',
      permissions: ['get', 'post']
    }, {
      resources: '/api/invoices/:invoiceId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/invoices/:invoiceId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Invoices Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Invoice is being processed and the current user created it then allow any manipulation
  if (req.invoice && req.user && req.invoice.user && req.invoice.user.id === req.user.id) {
    return next();
  }

  // If an Invoice is being processed and the current user's team created it then allow any manipulation
  if (req.invoice && req.user && req.invoice.user && req.invoice.user.provider === 'slack' && req.user.provider === 'slack' && req.invoice.user.providerData.team_id === req.user.providerData.team_id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
