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

  Invoice.aggregate([
    {
      $match: {
        user: user._id
      }
    },
    {
      $group: {
        _id: { month: { $month: "$dateDue" }, year: { $year: "$dateDue" } },
        totalAmount: { $sum: "$amountDue.amount" }
      }
    },
    {
      $sort: {
        totalAmount: -1
      }
    }
  ], function(err, result) {
    if (err) {
      console.log(err);
      web.chat.postMessage(channel, "Sorry, Something went wrong.");
    } else {
      console.log(result);
      if (result.length > 0) {
        var fields = [];
        for (var i = 0; i < result.length; i++) {
          fields.push(
            {
              "title": mS[result[i]._id.month] + " " + result[i]._id.year,
              "short": true
            },
            {
              "value": config.currencies[user.currency] + result[i].totalAmount,
              "short": true
            }
          );
          // text += result[i]._id.month + ", " + result[i]._id.year + " " + result[i].totalAmount + "\n";
        }

        var attachment = {
          "fallback": "",
          "callback_id": "create_client_business_name",
          "color": "#e2a5f8",
          "attachment_type": "default",
          "fields": fields
        };

        var data = {
          attachments: [attachment]
        };

        web.chat.postMessage(channel, "Alright, here we go! Here's all of our revenue!", data);
      } else {
        web.chat.postMessage(channel, "You have no invoices.");
      }
    }
  });
};
