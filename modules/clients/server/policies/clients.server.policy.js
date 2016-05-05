'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Clients Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/clients',
      permissions: '*'
    }, {
      resources: '/api/clients/:clientId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/clients',
      permissions: ['get', 'post']
    }, {
      resources: '/api/clients/:clientId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Clients Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Client is being processed and the current user created it then allow any manipulation
  if (req.client && req.user && req.client.user && req.client.user.id === req.user.id) {
    return next();
  }

  // If an Client is being processed and the current user's team created it then allow any manipulation
  if (req.client && req.user && req.client.user && req.client.user.provider === 'slack' && req.user.provider === 'slack' && req.client.user.providerData.team_id === req.user.providerData.team_id) {
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
