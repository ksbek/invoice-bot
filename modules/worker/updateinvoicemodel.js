'use strict';

// Create the notifications configuration
function sendInvoiceReminder() {
  var path = require('path');
  var config = require(path.resolve('./config/config'));
  var mongoose = require('mongoose');
  mongoose.connect(process.env.MONGOHQ_URL);
  require('../users/server/models/user.server.model.js');
  require('../clients/server/models/client.server.model.js');
  require('../invoices/server/models/invoice.server.model.js');
  require('../notifications/server/models/notifications.server.model.js');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  Invoice.find({}).populate('user').exec(function(err, invoices) {
    console.log(invoices.length);
    var successcount = 0;
    var failcount = 0;
    for( var i=0; i<invoices.length; i++) {
      if(invoices[i].user) {
        invoices[i].team_id=invoices[i].user.providerData.team_id;
        invoices[i].save(function(err, result){
          if(err)
            failcount ++;
          else
            successcount ++;
          console.log('Fail' + failcount);
          console.log('Success' + successcount);
        })
      }
    }
  });
};

sendInvoiceReminder();