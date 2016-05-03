'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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
 * Create instance method
 */
InvoiceSchema.statics.createInvoiceFromSlackBot = function (user_id, client_id, params, callback) {
  var _this = this;
  _this.create({
    user: user_id,
    client: client_id,
    name: params.name,
    amountDue: params.amount,
    dateDue: calcDate(params.date),
    description: params.description
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
};

mongoose.model('Invoice', InvoiceSchema);
