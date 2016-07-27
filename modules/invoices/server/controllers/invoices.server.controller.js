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
  invoice.team_id = req.user.providerData.team_id;
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
  if (req.user.roles.indexOf('user') > -1) {
    if (req.user.provider === 'slack')
      searchQuery = { team_id: req.user.providerData.team_id };
    else
      searchQuery = { user: req.user };
  }
  Invoice.find(searchQuery).sort('-created').populate('user', 'providerData').populate('client', 'companyName').exec(function(err, invoices) {
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
  Invoice.find({ client: req.params.clientId }).sort('-created').populate('user', 'providerData').populate('client', 'companyName').exec(function(err, invoices) {
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
 * Invoice opend by client
 */
exports.getInvoiceFromToken = function(req, res) {
  var userToken = req.params.token.substr(0, 40);
  var invoiceToken = req.params.token.substr(40, 40);

  console.log(req.params.token);
  console.log(invoiceToken);
  console.log(userToken);
  Invoice.findOne({ token: invoiceToken }).populate('user', 'companyName').populate('client', 'companyName email').exec(function(err, invoice) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if (invoice) {
        invoice.isRead = 1;
        invoice.save();
        User.findOne({
          accountSetupToken: userToken
        }, function (err, user) {
          if (user)
            require(require('path').resolve('modules/notifications/server/slack/notifications.server.send.slack.js'))(config, invoice, null, user, 0, 11);
        });
        res.jsonp(invoice);
      }
    }
  });
};

/**
 * Pay Invoice
 */
exports.paynow = function(req, res) {
  Invoice.findOne({ _id: req.invoice.id }).populate('user').populate('client').exec(function(err, invoice) {
    if (err) {
      return res.status(400).send({
        message: err.message
      });
    } else {
      var userID = invoice.user.id;
      if (invoice.user.teamManager)
        userID = invoice.user.teamManager;
      User.findById(userID, function (err, user) {
        if (user) {
          if (user.stripe) {
            var stripe = require('stripe')(user.stripe.access_token);

            if (invoice.status === 'paid')
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
                var application_fee = Math.ceil(invoice.amountDue.amount * 100 * config.stripe.application_fee);
                stripe.customers.create({
                  email: invoice.client.email,
                  source: token.id
                }).then(function(customer) {
                  stripe.charges.create({
                    amount: Math.ceil(invoice.amountDue.amount * 100),
                    currency: invoice.amountDue.currency,
                    customer: customer.id,
                    application_fee: application_fee,
                    receipt_email: invoice.client.email
                  }).then(function(charge) {
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
                        var type = 14;
                        var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
                        var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));

                        if (dueDays <= dueDateAllowance)
                          type = 15;
                        if (dueDays - dueDateAllowance > 30)
                          type = 13;
                        else if (dueDays - dueDateAllowance > 14)
                          type = 12;
                        // Send Notificatin to notification page and slack
                        require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, invoice, null, user, 0, type);

                        // Send paid invoice email to user
                        require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, invoice, user, 0, 2);

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
              message: 'Sorry, something went wrong'
            });
          }
        } else {
          return res.status(400).send({
            message: err
          });
        }
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
