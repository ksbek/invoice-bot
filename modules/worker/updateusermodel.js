'use strict';

// Create the notifications configuration
function sendInvoiceReminder() {
  var path = require('path');
  var config = require(path.resolve('./config/config'));
  var mongoose = require('mongoose');
  mongoose.connect(process.env.MONGOHQ_URL);
  require('../users/server/models/user.server.model.js');
  var User = mongoose.model('User');
  var _ = require('lodash');
  User.find({ provider: 'slack' }).sort('created').exec(function(err, result) {
    if (result.length > 0) {
      var newusers = _.groupBy(result, 'providerData.team_id');
      var successcount = 0;
      var failcount = 0;
      var totalcount = result.length;
      _.forEach(newusers, function(users, key) {
        for (var i = 0; i < users.length; i ++) {
          if (i === 0) {
            users[i].roles = ['user', 'users[0]'];
            users[i].status = 1;
          } else {
            users[i].status = 2;
            users[i].teamManager = users[0].id;
            users[i].stripe = users[0].stripe;
            users[i].integrations = users[0].integrations;
            users[i].companyName = users[0].companyName;
            users[i].businessNumber = users[0].businessNumber;
            users[i].clientsName = users[0].clientsName;
            users[i].phoneNumber = users[0].phoneNumber;
            users[i].currency = users[0].currency;
            users[i].tax = users[0].tax;
            users[i].includeTaxesOnInvoice = users[0].includeTaxesOnInvoice;
            users[i].dueDateAllowance = users[0].dueDateAllowance;
            users[i].address = users[0].address;
            users[i].website = users[0].website;
          }
          users[i].save(function(err, result){
            if(err)
              failcount ++;
            else
              successcount ++;

            console.log('Fail' + failcount);
            console.log('Success' + successcount);
            if (failcount + successcount === totalcount) {
              console.log('exit');
              process.exit();
            }
          });
        }
      });
    }
  });
}

sendInvoiceReminder();