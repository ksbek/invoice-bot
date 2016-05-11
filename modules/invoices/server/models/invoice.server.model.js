'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  SchemaTypes = mongoose.Schema.Types;
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
    default: '',
    trim: true
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
    return Date.now;
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
InvoiceSchema.statics.createInvoiceFromSlackBot = function (user_id, client_id, params, callback) {
  var _this = this;
  var possibleNumber = Math.floor(Math.random() * 100000) + 100000;
  _this.findUniqueInvoiceNumber(possibleNumber, function (number) {
    _this.create({
      user: user_id,
      client: client_id,
      name: params.name,
      amountDue: { amount: params.amount },
      dateDue: calcDate(params.duedate),
      description: params.description,
      invoice: number
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
};

mongoose.model('Invoice', InvoiceSchema);
