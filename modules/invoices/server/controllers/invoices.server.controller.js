'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Invoice = mongoose.model('Invoice'),
  config = require(path.resolve('./config/config')),
  stripe = require('stripe')(config.stripe.access_token),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Invoice
 */
exports.create = function(req, res) {
  var invoice = new Invoice(req.body);
  invoice.user = req.user;

  invoice.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(invoice);
    }
  });
};

/**
 * Show the current Invoice
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var invoice = req.invoice ? req.invoice.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  invoice.isCurrentUserOwner = req.user && invoice.user && invoice.user._id.toString() === req.user._id.toString();

  res.jsonp(invoice);
};

/**
 * Update a Invoice
 */
exports.update = function(req, res) {
  var invoice = req.invoice;

  invoice = _.extend(invoice, req.body);

  invoice.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(invoice);
    }
  });
};

/**
 * Delete an Invoice
 */
exports.delete = function(req, res) {
  var invoice = req.invoice;

  invoice.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(invoice);
    }
  });
};

/**
 * List of Invoices
 */
exports.list = function(req, res) {
  Invoice.find({ user: req.user }).sort('-created').populate('user', 'displayName').populate('client').exec(function(err, invoices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(invoices);
    }
  });
};

/**
 * Pay Invoice
 */
exports.paynow = function(req, res) {
  stripe.tokens.create({
    card: req.body.params.card
  }, function(err, token) {
    // asynchronously called
    if (err) {
      return res.status(400).send({
        message: err.message
      });
    } else {
      var application_fee = Math.ceil(req.invoice.amountDue.amount * 0.32);

      stripe.customers.create({
        email: req.invoice.client.email,
        source: token.id
      }).then(function(customer) {
        stripe.charges.create({
          amount: req.invoice.amountDue.amount * 100,
          currency: req.user.currency,
          customer: customer.id,
          application_fee: application_fee,
          receipt_email: req.invoice.client.email
        }).then(function(charge) {
          // New charge created on a new customer
          console.log(charge);
          res.send(charge);
        });
      }).catch(function(err) {
        // Deal with an error
        return res.status(400).send({
          message: err.message
        });
      });
    }
  });
};

/**
 * Invoice middleware
 */
exports.invoiceByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Invoice is invalid'
    });
  }

  Invoice.findById(id).populate('user', 'displayName').populate('client').exec(function (err, invoice) {
    if (err) {
      return next(err);
    } else if (!invoice) {
      return res.status(404).send({
        message: 'No Invoice with that identifier has been found'
      });
    }
    req.invoice = invoice;
    next();
  });
};
