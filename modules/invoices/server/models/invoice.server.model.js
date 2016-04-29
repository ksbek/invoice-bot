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
    type: Number,
    default: 0
  },
  received: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
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

mongoose.model('Invoice', InvoiceSchema);
