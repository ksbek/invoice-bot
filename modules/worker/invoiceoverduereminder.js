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

  Invoice.find({ status: 'due' }).populate('user').populate('client').exec(function(err, invoices) {
    invoices = invoices.filter(function(invoice) {
      var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
      return invoice.user && !(dueDays <= dueDateAllowance);
    });
    var totalCount = invoices.length;
    console.log(totalCount);
    var processedCount = 0;
    for (var i = 0; i < invoices.length; i++) {
      var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoices[i].dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.ceil((new Date(invoices[i].dateDue).getTime() - new Date(invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      var type = 0;
      console.log(invoices[i].invoice + "     " + dueDays);
      console.log(invoices[i].invoice + "     " + dueDateAllowance);
      console.log(invoices[i].invoice + "     " +(dueDays - dueDateAllowance));
      if (dueDays > 37) 
        type = 10;
      else if (dueDays > 30)
        type = 9;
      else if (dueDays > 21)
        type = 8;
      else if (dueDays > 14)
        type = 7;
      else if (dueDays - dueDateAllowance === 1)
        type = 6;
      else
        processedCount ++;
      if (type != 0 && invoices[i].user) {
        require(require('path').resolve('modules/notifications/server/mailer/notifications.server.mailer.js'))(config, invoices[i], invoices[i].user, dueDays, type, function(result, invoice, dueDays, notify_type) {
          console.log(result);
          if (result) {
            console.log(notify_type);
            require(require('path').resolve('modules/notifications/server/slack/notifications.server.send.slack.js'))(config, invoice, null, invoice.user, dueDays, notify_type, function(reuslt) {
              processedCount ++;
              if (processedCount === totalCount) {
                console.log('exit');
                process.exit();
              }
            });
          } else {
            processedCount ++;
            if (processedCount === totalCount) {
              console.log('exit');
              process.exit();
            }
          }
        });
      }
      if (processedCount === totalCount) {
        console.log('exit');
        process.exit();
      }
    }
  });
};

sendInvoiceReminder();