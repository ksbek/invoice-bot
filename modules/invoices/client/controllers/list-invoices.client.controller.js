(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListController', InvoicesListController);

  InvoicesListController.$inject = ['InvoicesService', '$uibModal', 'Authentication'];

  function InvoicesListController(InvoicesService, $uibModal, Authentication) {
    var vm = this;
    vm.authentication = Authentication;
    vm.currencySymbols = {
      USD: '$',
      AUD: 'A$',
      EURO: '€',
      GBP: '£'
    };

    vm.invoices = InvoicesService.query();

    vm.invoices.$promise.then(function (invoices) {
      vm.invoices = invoices;
      for (var i = 0; i < vm.invoices.length; i ++) {
        var dueDays = Math.floor((new Date().getTime() - new Date(vm.invoices[i].dateDue).getTime()) / (1000 * 3600 * 24));
        if (vm.invoices[i].status !== 'paid') {
          if (dueDays < vm.authentication.user.dueDateAllowance || vm.authentication.user.dueDateAllowance === 0)
            vm.invoices[i].status = "due";
          else
            vm.invoices[i].status = "overdue";
        }
      }
    });
    /*
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
    */
  }
}());
