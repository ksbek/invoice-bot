'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  User = mongoose.model('User');

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = req.user;

  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  if (user) {
    // Merge existing user
    user = _.extend(user, req.body);
    user.updated = Date.now();
    user.displayName = user.firstName + ' ' + user.lastName;

    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // Send Notificatin to notification page and slack
        console.log(req.user.changedTax);
        if (req.user.changedTax)
          require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, null, null, user, 0, 3);
        if (req.user.changedDueDateAllowance)
          require(require('path').resolve("modules/notifications/server/slack/notifications.server.send.slack.js"))(config, null, null, user, 0, 4);

        User.find({ 'providerData.team_id': req.user.providerData.team_id }).exec(function (err, users) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          for (var i = 0; i < users.length; i ++) {
            users[i].integrations = req.user.integrations;
            users[i].companyName = req.user.companyName;
            users[i].currency = req.user.currency;
            users[i].tax = req.user.tax;
            users[i].includeTaxesOnInvoice = req.user.includeTaxesOnInvoice;
            users[i].dueDateAllowance = req.user.dueDateAllowance;
            users[i].save(function(err) {
              console.log(err);
            });
          }
        });
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Delete a user
 */
exports.deleteUser = function (req, res) {
  var user = new User(req.body.user);

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Update profile picture
 */
exports.setManager = function (req, res) {
  var user = new User(req.body.user);
  user.roles = ['user', 'teammanager'];
  user.isNew = false;
  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var user = req.user;
  var upload = multer(config.uploads.profileUpload).single('newProfilePicture');
  var profileUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = profileUploadFileFilter;

  if (user) {
    upload(req, res, function (uploadError) {
      if (uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading profile picture'
        });
      } else {
        user.profileImageURL = config.uploads.profileUpload.dest + req.file.filename;

        user.save(function (saveError) {
          if (saveError) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(saveError)
            });
          } else {
            req.login(user, function (err) {
              if (err) {
                res.status(400).send(err);
              } else {
                res.json(user);
              }
            });
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Get Team Members
 */
exports.getTeamMembers = function(req, res) {
  User.find({ 'providerData.team_id': req.user.providerData.team_id }).sort('created').populate('user').exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};


/**
 * Send User
 */
exports.me = function (req, res) {
  res.json(req.user || null);
};
