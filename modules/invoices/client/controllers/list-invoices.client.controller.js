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
      'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
    };

    vm.invoices = invoices;

    for (var i = 0; i < vm.invoices.length; i ++) {
      var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(vm.invoices[i].dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.ceil((new Date(vm.invoices[i].dateDue).getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      if (vm.invoices[i].status !== 'paid') {
        if (dueDays <= dueDateAllowance)
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
        var dueDays = Math.ceil((new Date().setHours(0, 0, 0, 0) - new Date(invoice.dateIssued).setHours(0, 0, 0, 0)) / (1000 * 3600 * 24));
        var dueDateAllowance = Math.ceil((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        if (invoice.status !== 'paid') {
          if (dueDays <= dueDateAllowance)
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
