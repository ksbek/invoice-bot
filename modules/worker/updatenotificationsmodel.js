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
  var Notification = mongoose.model('Notification');

  Notification.find({}).populate('user').exec(function(err, notifications) {
    console.log(notifications.length);
    var successcount = 0;
    var failcount = 0;
    for( var i=0; i<notifications.length; i++) {
      if(notifications[i].user) {
        notifications[i].team_id=notifications[i].user.providerData.team_id;
        notifications[i].save(function(err, result){
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