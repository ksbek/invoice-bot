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
var NotificationSchema = new Schema({
  dateIssued: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: Number,
    default: 0,
    trim: true
  },
  status: {
    type: Number,
    default: 0,
    trim: true
  },
  isRead: {
    type: Number,
    default: 0,
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  team_id: {
    type: String
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Notification', NotificationSchema);
