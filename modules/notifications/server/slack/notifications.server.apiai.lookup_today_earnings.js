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

  var start = new Date();
  start.setHours(0, 0, 0, 0);

  var end = new Date();
  end.setHours(23, 59, 59, 999);
  Invoice.find({ user: user._id, datePaid: { $gte: start, $lt: end } }).populate('client', 'companyName').exec(function(err, result) {
    if (err) {
      console.log(err);
      web.chat.postMessage(channel, 'Sorry, Something went wrong.');
    } else {
      console.log(result);
      if (result.length > 0) {
        var fields = [];
        var totalAmount = 0;
        for (var i = 0; i < result.length; i ++) {
          totalAmount += result[i].amountDue.amount;
          fields.push(
            {
              'value': '<' + config.baseUrl + '/invoices/' + result[i]._id + '|INV' + result[i].invoice + '>' + '        ' + '<' + config.baseUrl + '/clients/' + result[i].client._id + '/edit' + '|' + result[i].client.companyName + '>',
              'short': true
            },
            {
              'value': config.currencies[user.currency] + result[i].amountDue.amount,
              'short': true
            }
          );
          // text += result[i]._id.month + ', ' + result[i]._id.year + ' ' + result[i].totalAmount + '\n';
        }

        fields.unshift(
          {
            'title': new Date().getDate() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getFullYear() + '          Total earning',
            'short': true
          },
          {
            'value': config.currencies[user.currency] + totalAmount,
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

        web.chat.postMessage(channel, 'Todays earnings', data);
      } else {
        web.chat.postMessage(channel, 'You have no paid invoices today.');
      }
    }
  });
};
