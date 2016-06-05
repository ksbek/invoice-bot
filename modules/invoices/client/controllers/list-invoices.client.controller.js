(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListController', InvoicesListController);

  InvoicesListController.$inject = ['InvoicesService', '$uibModal', 'Authentication', 'invoices'];

  function InvoicesListController(InvoicesService, $uibModal, Authentication, invoices) {
    var vm = this;
    vm.authentication = Authentication;
    vm.currencySymbols = {
      'USD': '$',
      'AUD': 'A$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$'
    };

    vm.invoices = invoices;

    for (var i = 0; i < vm.invoices.length; i ++) {
      var dueDays = Math.floor((new Date().getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.floor((new Date(vm.invoices[i].dateDue).getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      if (vm.invoices[i].status !== 'paid') {
        if (dueDays < dueDateAllowance || dueDateAllowance === 0)
          vm.invoices[i].status = "due";
        else
          vm.invoices[i].status = "overdue";
        vm.invoices[i].dateDue = new Date(vm.invoices[i].dateDue);
      }
    }

    vm.saveInvoice = saveInvoice;
    vm.exitEdit = exitEdit;
    vm.edit = edit;
    vm.editRow = -1;

    // Save Invoice
    function saveInvoice(invoice) {
      // TODO: move create/update logic to service
      if (invoice._id) {
        invoice.$update(successCallback, errorCallback);
      } else {
        invoice.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
        invoice = res;
        vm.tempInvoice = null;
        var dueDays = Math.floor((new Date().getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        var dueDateAllowance = Math.floor((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        if (invoice.status !== 'paid') {
          if (dueDays < dueDateAllowance || dueDateAllowance === 0)
            invoice.status = "due";
          else
            invoice.status = "overdue";
          invoice.dateDue = new Date(invoice.dateDue);
        }
      }

      function errorCallback(res) {
        vm.error = res.data.message;
        vm.editRow = -1;
        vm.tempInvoice = null;
      }
    }

    function edit(invoice, row) {
      if (vm.editRow !== -1)
        return;
      vm.editRow = row;
      invoice.dateDue = new Date(invoice.dateDue);
      vm.tempInvoice = angular.copy(invoice);
    }

    function exitEdit(invoice, row) {
      vm.editRow = -1;
      var index = vm.invoices.findIndex(
        function(inv) {
          return inv._id === invoice._id;
        });
      vm.invoices[index] = vm.tempInvoice;
      vm.tempInvoice = null;
    }
  }
}());
