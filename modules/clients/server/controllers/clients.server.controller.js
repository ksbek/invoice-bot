'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Client = mongoose.model('Client'),
  Invoice = mongoose.model('Invoice'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Client
 */
exports.create = function(req, res) {
  var client = new Client(req.body);
  client.user = req.user;

  client.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(client);
    }
  });
};

/**
 * Show the current Client
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var client = req.client ? req.client.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  client.isCurrentUserOwner = req.user && client.user && client.user._id.toString() === req.user._id.toString();

  res.jsonp(client);
};

/**
 * Update a Client
 */
exports.update = function(req, res) {
  var client = req.client;

  client = _.extend(client, req.body);

  client.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(client);
    }
  });
};

/**
 * Delete an Client
 */
exports.delete = function(req, res) {
  var client = req.client;

  client.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(client);
    }
  });
};

/**
 * List of Clients
 */
exports.list = function(req, res) {
  var arrClients = [];
  Client.find({ user: req.user._id }).sort('-created').populate('user', 'companyName').exec(function(err, clients) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if (clients.length === 0) {
        res.jsonp(clients);
      }
      var completed = 0;
      var complete = function() {
        completed++;
        if (completed === clients.length) {
          res.jsonp(arrClients);
        }
      };

      var processing = function(client) {
        Invoice.find({ client: client.id }, function (err, invoices) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            client.invoices = invoices;
            arrClients.push(client);
            complete();
          }
        });
      };
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        processing(client);
      }
    }
  });
};

/**
 * Client middleware
 */
exports.clientByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Client is invalid'
    });
  }

  Client.findById(id).populate('user', 'companyName').exec(function (err, client) {
    if (err) {
      return next(err);
    } else if (!client) {
      return res.status(404).send({
        message: 'No Client with that identifier has been found'
      });
    }
    req.client = client;
    next();
  });
};

