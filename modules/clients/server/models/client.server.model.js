'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  validator = require('validator'),
  Schema = mongoose.Schema;

/**
 * A Validation function for local strategy email
 */
var validateLocalStrategyEmail = function (email) {
  return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email, { require_tld: false }));
};

/**
 * Client Schema
 */
var ClientSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill Client name',
    trim: true
  },
  companyName: {
    type: String,
    default: '',
    required: 'Please fill Client company name',
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    default: '',
    validate: [validateLocalStrategyEmail, 'Please fill a valid email address']
  },
  phoneNumber: {
    type: String,
    default: '',
    required: 'Please fill Phone Number',
    trim: true
  },
  address: {
    type: String,
    default: '',
    required: 'Please fill Client address',
    trim: true
  },
  businessNumber: {
    type: String,
    default: '',
    required: 'Please fill Client business number',
    trim: true
  },
  website: {
    type: String,
    default: '',
    required: 'Please fill Client website',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Client', ClientSchema);
