'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, EmailTemplate) {
  var sendgrid = require("sendgrid")(config.sendgrid.apiKey);
  var email = new sendgrid.Email();

  var templateDir = require('path').resolve('./modules/notifications/server/views/mail_templates');
  console.log(templateDir);
  var newsletter = new EmailTemplate(templateDir);

  newsletter.render({ invoice: invoice }, function (err, result) {
    email.addTo(invoice.user.email);
    email.setFrom("chris@adsmetric.com");
    email.setSubject("Nowdue Invoice Transaction Email");
    email.setHtml(result.html);
    sendgrid.send(email, function (err, json) {
      console.log(err);
    });
  });
};
