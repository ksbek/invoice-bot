'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, user, mail_type) {
  var sendgrid = require("sendgrid")(config.sendgrid.apiKey);
  var email = new sendgrid.Email();

  email.html = '<h1>Hi There</h1>';
  email.setFrom("chris@adsmetric.com");
  email.addFilter('templates', 'enable', 1);

  switch (mail_type) {
    case 1:
      // Invoice Created
      email.addTo(invoice.client.email);
      email.setSubject("Nowdue Invoice Transaction Email");

      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoiceCreated);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", invoice.id);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", invoice.amountDue.amount);
      break;
    case 2:
      // Invoice Paid
      email.addTo(user.email);
      email.setSubject("Nowdue Invoice Paid");
      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoicePaid);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", invoice.id);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", invoice.amountDue.amount);
  }

  sendgrid.send(email, function (err, json) {
    console.log(err);
  });
};
