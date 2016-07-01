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
  var _ = require('lodash');

  Invoice.find({ user: user._id, status: 'paid' }).populate('client', 'companyName').exec(function(err, result) {
    if (err) {
      console.log(err);
      web.chat.postMessage(channel, "Sorry, Something went wrong.");
    } else {
      if (result.length > 0) {
        var groupByClient = _.groupBy(result, 'client._id');
        var newResult = _.sortBy(groupByClient, function(o) { return (-1) * _.sumBy(o, 'amountDue.amount'); });

        console.log(newResult);
        var fields = [];
        var i = 0;
        _.forEach(newResult, function(invoices, key) {
          i = i + 1;
          var paidStr = "";
          if (invoices.length > 1)
            paidStr = " invoices paid";
          else
            paidStr = " invoice paid";
          fields.push(
            {
              "value": i + "          " + '<' + config.baseUrl + '/clients/' + invoices[0].client._id + '/edit' + '|' + invoices[0].client.companyName + '>',
              "short": true
            },
            {
              "value": invoices.length + paidStr + "        " + config.currencies[user.currency] + _.sumBy(invoices, 'amountDue.amount'),
              "short": true
            }
          );
          // text += result[i]._id.month + ", " + result[i]._id.year + " " + result[i].totalAmount + "\n";
        });

        var attachment = {
          "fallback": "",
          "color": "#e2a5f8",
          "attachment_type": "default",
          "fields": fields
        };

        var data = {
          attachments: [attachment]
        };

        web.chat.postMessage(channel, "Here is the order of your top clients", data);
      } else {
        web.chat.postMessage(channel, "You have no paid invoices.");
      }
    }
  });
};
