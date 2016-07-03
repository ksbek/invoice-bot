'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  SchemaTypes = mongoose.Schema.Types,
  crypto = require('crypto');
/**
 * Invoice Schema
 */
var InvoiceSchema = new Schema({
  invoice: {
    type: Number,
    default: 0
  },
  dateIssued: {
    type: Date,
    default: Date.now
  },
  dateDue: {
    type: Date,
    default: Date.now
  },
  datePaid: {
    type: Date
  },
  amountDue: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    }
  },
  received: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'due',
    trim: true
  },
  dueDateAllowance: {
    type: Number,
    default: 7
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  tax: {
    type: Number,
    default: 0
  },
  isRead: {
    type: Number,
    default: 0
  },
  client: {
    type: Schema.ObjectId,
    ref: 'Client'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

var calcDate = function (dateString) {
  var days = dateString.match(/\d/g);
  var date = new Date();
  if (dateString.indexOf("day") > -1) {
    var res = date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    return new Date(res);
  } else {
    return new Date;
  }
};

/**
 * Find possible not used username
 */
InvoiceSchema.statics.findUniqueInvoiceNumber = function (number, callback) {
  var _this = this;
  var possibleNumber = number;

  _this.findOne({
    invoice: possibleNumber
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possibleNumber);
      } else {
        return _this.findUniqueInvoiceNumber(Math.floor(Math.random() * 100000) + 100000, callback);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Create instance method
 */
InvoiceSchema.statics.createInvoiceFromSlackBot = function (user, client_id, params, callback) {
  var _this = this;
  var possibleNumber = Math.floor(Math.random() * 100000) + 100000;
  var dueDate = new Date(new Date().setTime(new Date().getTime() + (user.dueDateAllowance * 24 * 60 * 60 * 1000)));
  // var dueDate = new Date;
  crypto.randomBytes(20, function (err, buffer) {
    var token = buffer.toString('hex');
    _this.findUniqueInvoiceNumber(possibleNumber, function (number) {
      _this.create({
        user: user.id,
        client: client_id,
        amountDue: { amount: Math.round(params.amount * (1 + user.tax / 100) * 100) / 100, currency: user.currency },
        dateDue: dueDate,
        description: params.description,
        invoice: number,
        dueDateAllowance: user.dueDateAllowance,
        tax: user.tax,
        token: token
      }, function (err, invoice) {
        if (!err) {
          if (!invoice) {
            callback(null);
          } else {
            callback(invoice);
          }
        } else {
          callback(null);
        }
      });
    });
  });
};

mongoose.model('Invoice', InvoiceSchema);
