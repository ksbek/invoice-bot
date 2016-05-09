(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListController', InvoicesListController);

  InvoicesListController.$inject = ['InvoicesService', '$uibModal'];

  function InvoicesListController(InvoicesService, $uibModal) {
    var vm = this;

    vm.invoices = InvoicesService.query();
    vm.payInvoice = payInvoice;

    vm.currencySymbols = {
      USD: '$',
      AUD: 'A$',
      EURO: '€',
      GBP: '£'
    };

    function payInvoice(invoice) {
      var modalInstance = $uibModal.open({
        templateUrl: 'modules/invoices/client/views/pay-invoice.client.view.html',
        size: 'lg',
        windowClass: 'invoice-modal',
        controller: ['$state', 'Authentication', 'invoice', function($scope, Authentication, invoice) {
          var vm = this;
          vm.invoice = invoice;
          vm.authentication = Authentication;
          var dateDue = new Date(vm.invoice.dateDue);
          var today = new Date();
          var timeDiff = Math.abs(dateDue.getTime() - today.getTime());
          vm.invoice.dateDueLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }],
        controllerAs: 'vm',
        resolve: {
          invoice: invoice
        }
      });
    }
  }
}());
