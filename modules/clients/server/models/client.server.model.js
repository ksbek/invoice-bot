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
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  businessNumber: {
    type: String,
    default: '',
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  team_id: {
    type: String
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  invoices: [{
    type: Schema.ObjectId,
    ref: 'Invoice'
  }]
});

/**
 * Return client_id By name
 */
ClientSchema.statics.findClientByName = function (name, user, callback) {
  this.findOne({
    $or: [{ "name": { $regex: new RegExp(["^", name, "$"].join(""), "i") } }, { "companyName": { $regex: new RegExp(["^", name, "$"].join(""), "i") } }],
    team_id: user.providerData.team_id
  }, function (err, client) {
    if (!err) {
      if (!client) {
        callback(null);
      } else {
        callback(client);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Create Client from Slack
 */
ClientSchema.statics.createClientFromSlackBot = function (user, params, callback) {
  var _this = this;
  _this.create({
    user: user.id,
    companyName: params.name,
    name: params.contactname,
    email: params.email,
    team_id: user.providerData.team_id
  }, function (err, client) {
    if (!err) {
      if (!client) {
        callback(null);
      } else {
        callback(client);
      }
    } else {
      console.log(err);
      callback(null);
    }
  });
};

mongoose.model('Client', ClientSchema);
