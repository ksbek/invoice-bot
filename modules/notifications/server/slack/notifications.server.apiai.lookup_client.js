'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');
  if (response.result.parameters.any !== '') {

    // Check if user have client
    Client.findClientByName(response.result.parameters.any, user, function(client) {
      if (client) {
        Invoice.find({ client: client.id }, function (err, invoices) {
          if (err) {
            web.chat.postMessage(channel, 'Sorry.Something went wrong.');
          } else {
            var fields = [];

            fields.push(
              {
                'title': 'Contact',
                'short': true
              },
              {
                'value': client.name,
                'short': true
              },
              {
                'title': 'Company',
                'short': true
              },
              {
                'value': client.companyName,
                'short': true
              },
              {
                'title': 'Email',
                'short': true
              },
              {
                'value': client.email,
                'short': true
              },
              {
                'title': 'Address',
                'short': true
              },
              {
                'value': client.address,
                'short': true
              },
              {
                'title': 'Phone number',
                'short': true
              },
              {
                'value': client.phoneNumber,
                'short': true
              },
              {
                'title': 'Website',
                'short': true
              },
              {
                'value': client.website,
                'short': true
              },
              {
                'title': 'Invoice Sent',
                'short': true
              },
              {
                'value': invoices.length,
                'short': true
              }
            );

            if (invoices.length > 0) {
              var paidInvoices = invoices.filter(function(invoice) { return invoice.status === 'paid'; });
              var paidAmount = 0;
              for (var i = 0; i < paidInvoices.length; i++)
                paidAmount += paidInvoices[i].amountDue.amount;

              var nowdueInvoices = invoices.filter(function(invoice) {
                var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
                var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
                return invoice.status !== 'paid' && dueDays <= dueDateAllowance;
              });

              var overdueInvoices = invoices.filter(function(invoice) {
                var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
                var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
                return invoice.status !== 'paid' && !(dueDays <= dueDateAllowance);
              });

              fields.push(
                {
                  'title': 'Total paid',
                  'short': true
                },
                {
                  'value': config.currencies[user.currency] + paidAmount,
                  'short': true
                },
                {
                  'title': 'Nowdue',
                  'short': true
                },
                {
                  'value': nowdueInvoices.length,
                  'short': true
                },
                {
                  'title': 'Overdue',
                  'short': true
                },
                {
                  'value': overdueInvoices.length,
                  'short': true
                }
              );
            }

            var attachment = {
              'fallback': '',
              'color': '#e2a5f8',
              'attachment_type': 'default',
              'fields': fields
            };

            var data = {
              attachments: [attachment]
            };

            web.chat.postMessage(channel, 'Here\'s all we have on the client!', data);
          }
        });
      } else {
        web.chat.postMessage(channel, 'I\'m sorry, I can\'t seem to find the information you requested. Could you check over that the information you gave me is correct and try again? I really appreciate it.');
      }
    });
  }
};
