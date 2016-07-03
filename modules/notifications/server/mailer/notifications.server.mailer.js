'use strict';

// Create the notifications configuration
module.exports = function (config, invoice, user, mail_type, callback) {
  var sendgrid = require("sendgrid")(config.sendgrid.apiKey);
  var email = new sendgrid.Email();
  var currencySymbols = {
    'USD': '$',
    'AUD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$'
  };
  console.log(user);
  email.html = '<h1>Hi There</h1>';
  email.setFrom(config.sendgrid.from);
  email.addFilter('templates', 'enable', 1);
  switch (mail_type) {
    case 1:
      // Invoice Created
      email.addTo(invoice.client.email);
      email.setCcs([user.email]);
      email.setSubject("Nowdue Invoice Transaction Email");

      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoiceCreated);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", 'token/' + user.accountSetupToken + invoice.token);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", currencySymbols[invoice.amountDue.currency] + invoice.amountDue.amount + " " + invoice.amountDue.currency);
      break;
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      email.addTo(invoice.client.email);
      email.setSubject("Invoice Overdue Email");

      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoiceCreated);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", 'token/' + user.accountSetupToken + invoice.token);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", currencySymbols[invoice.amountDue.currency] + invoice.amountDue.amount + " " + invoice.amountDue.currency);
      break;
    case 2:
      // Invoice Paid
      email.addTo(user.email);
      email.setCcs([invoice.client.email]);
      email.setSubject("Nowdue Invoice Paid");
      email.addFilter('templates', 'template_id', config.sendgrid.templates.invoicePaid);
      email.addSubstitution("&lt;%= invoice.client.companyName %&gt;", invoice.client.companyName);
      email.addSubstitution("&lt;%= invoice.id %&gt;", invoice.id);
      email.addSubstitution("&lt;%= invoice.invoice %&gt;", invoice.invoice);
      email.addSubstitution("&lt;%= invoice.amountDue.amount %&gt;", currencySymbols[invoice.amountDue.currency] + invoice.amountDue.amount + " " + invoice.amountDue.currency);
  }

  sendgrid.send(email, function (err, json) {
    if (err) {
      if (callback) {
        callback(false);
      }
    } else {
      if (callback) {
        callback(true, invoice);
      }
    }
  });
};
