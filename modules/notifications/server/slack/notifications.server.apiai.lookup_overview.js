'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');
  var mL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  Invoice.find({ user: user.id }).exec(function(err, invoices) {
    if (err) {
      console.log(err);
      web.chat.postMessage(channel, 'Sorry, Something went wrong.');
    } else {
      var text = '';
      var fields = [];

      if (invoices.length > 0) {
        var paidInvoices = invoices.filter(function(invoice) { return invoice.status === 'paid'; });
        var paidAmount = 0;
        var i;
        for (i = 0; i < paidInvoices.length; i++)
          paidAmount += paidInvoices[i].amountDue.amount;

        var nowdueInvoices = invoices.filter(function(invoice) {
          var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
          var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
          return invoice.status !== 'paid' && dueDays <= dueDateAllowance;
        });
        var nowdueAmount = 0;
        for (i = 0; i < nowdueInvoices.length; i++)
          nowdueAmount += nowdueInvoices[i].amountDue.amount;

        var overdueInvoices = invoices.filter(function(invoice) {
          var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
          var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
          return invoice.status !== 'paid' && !(dueDays <= dueDateAllowance);
        });
        var overdueAmount = 0;
        for (i = 0; i < overdueInvoices.length; i++)
          overdueAmount += overdueInvoices[i].amountDue.amount;

        fields.push(
          {
            'title': 'Paid',
            'short': true
          },
          {
            'value': paidInvoices.length + '         ' + config.currencies[user.currency] + paidAmount,
            'short': true
          },
          {
            'title': 'Nowdue',
            'short': true
          },
          {
            'value': nowdueInvoices.length + '         ' + config.currencies[user.currency] + nowdueAmount,
            'short': true
          },
          {
            'title': 'Overdue',
            'short': true
          },
          {
            'value': overdueInvoices.length + '         ' + config.currencies[user.currency] + overdueAmount,
            'short': true
          }
        );

        var attachment = {
          'fallback': '',
          'callback_id': 'create_client_business_name',
          'color': '#e2a5f8',
          'attachment_type': 'default',
          'fields': fields
        };

        var data = {
          attachments: [attachment]
        };

        web.chat.postMessage(channel, 'Here is the current status on invoices', data);
      } else {
        web.chat.postMessage(channel, 'You have no invoices.');
      }
    }
  });
};
