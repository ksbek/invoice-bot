(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListByClientController', InvoicesListByClientController);

  InvoicesListByClientController.$inject = ['InvoicesService', '$uibModal', '$http', 'Authentication', 'invoices'];

  function InvoicesListByClientController(InvoicesService, $uibModal, $http, Authentication, invoices) {
    var vm = this;
    vm.authentication = Authentication;
    vm.currencySymbols = {
      'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'AUD': '$', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'CAD': '$', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'EUR': '€', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'GBP': '£', 'USD': '$', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
    };


    vm.invoices = invoices.data;

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
      vm.editRow = -1;
      vm.tempInvoice = null;

      if (invoice._id) {
        new InvoicesService(invoice).$update(successCallback, errorCallback);
      } else {
        new InvoicesService(invoice).$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
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
      vm.invoices[row] = vm.tempInvoice;
      vm.tempInvoice = null;
    }
  }
}());
