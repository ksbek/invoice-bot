'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Invoice = mongoose.model('Invoice'),
  User = mongoose.model('User'),
  Notification = mongoose.model('Notification'),
  config = require(path.resolve('./config/config')),
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
  var searchQuery = { };
  if (req.user.roles.indexOf('user') > -1)
    searchQuery = { user: req.user };
  Invoice.find(searchQuery).sort('-created').populate('user', 'companyName').populate('client', 'companyName').exec(function(err, invoices) {
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
 * List of Invoices By Client
 */
exports.getListByClient = function(req, res) {
  Invoice.find({ client: req.params.clientId }).sort('-created').populate('user', 'companyName').populate('client', 'companyName').exec(function(err, invoices) {
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
  User.findById(req.invoice.user.id, function (err, user) {
    if (user) {
      if (user.stripe) {
        var stripe = require('stripe')(user.stripe.access_token);

        if (req.invoice.status === 'paid')
          return res.status(400).send({
            message: "This invoice is already paid"
          });

        stripe.tokens.create({
          card: req.body.params.card
        }, function(err, token) {
          // asynchronously called
          if (err) {
            return res.status(400).send({
              message: err.message
            });
          } else {
            var application_fee = Math.ceil(req.invoice.amountDue.amount * 100 * config.stripe.application_fee);

            stripe.customers.create({
              email: req.invoice.client.email,
              source: token.id
            }).then(function(customer) {
              stripe.charges.create({
                amount: req.invoice.amountDue.amount * 100,
                currency: req.invoice.amountDue.currency,
                customer: customer.id,
                application_fee: application_fee,
                receipt_email: req.invoice.client.email
              }).then(function(charge) {
                var invoice = req.invoice;
                invoice.status = 'paid';
                invoice.received = 1;
                invoice.datePaid = new Date();
                invoice = _.extend(invoice, req.body);

                invoice.save(function(err) {
                  if (err) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  } else {
                    // Send Notificatin to notification page and slack
                    require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, req.invoice, user, 19);

                    // Send paid invoice email to user
                    require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, req.invoice, user, 2);

                    res.send(invoice);
                  }
                });
              }).catch(function(err) {
                // Deal with an error
                return res.status(400).send({
                  message: err.message
                });
              });
            }).catch(function(err) {
              // Deal with an error
              return res.status(400).send({
                message: err.message
              });
            });
          }
        });
      } else {
        return res.status(400).send({
          message: err
        });
      }
    } else {
      return res.status(400).send({
        message: err
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

  Invoice.findById(id).populate('user', 'companyName').populate('client', 'companyName').exec(function (err, invoice) {
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
