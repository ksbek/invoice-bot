'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, user, mail_type) {
  var sendgrid = require("sendgrid")(config.sendgrid.apiKey);
  var email = new sendgrid.Email();
  var currencySymbols = {
    'USD': '$',
    'AUD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$'
  };

  email.html = '<h1>Hi There</h1>';
  email.setFrom(config.sendgrid.from);
  email.addFilter('templates', 'enable', 1);
  switch (mail_type) {
    case 1:
      // Invoice Created
      email.addTo(invoice.client.email);
      email.setCcs([user.email, 'genrich623@gmail.com']);
      email.setSubject("Nowdue Invoice Transaction Email");

      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoiceCreated);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", invoice.id);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", currencySymbols[invoice.amountDue.currency] + invoice.amountDue.amount + " " + invoice.amountDue.currency);
      break;
    case 2:
      // Invoice Paid
      email.addTo(user.email);
      email.setCcs([invoice.client.email, 'genrich623@gmail.com']);
      email.setSubject("Nowdue Invoice Paid");
      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoicePaid);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", invoice.id);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", currencySymbols[invoice.amountDue.currency] + invoice.amountDue.amount + " " + invoice.amountDue.currency);
  }

  sendgrid.send(email, function (err, json) {
    console.log(err);
  });
};
