(function () {
  'use strict';

  // Invoices controller
  angular
    .module('invoices')
    .controller('InvoicesController', InvoicesController);

  InvoicesController.$inject = ['$scope', '$state', 'Authentication', 'invoiceResolve', 'ClientsService'];

  function InvoicesController ($scope, $state, Authentication, invoice, ClientsService) {
    var vm = this;

    if ($state.current.name !== 'invoicesview') {
      vm.clients = ClientsService.query();
    }

    vm.authentication = Authentication;
    vm.invoice = invoice;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.invoice.dateDue = new Date(vm.invoice.dateDue);
    var today = new Date();
    var timeDiff = Math.abs(vm.invoice.dateDue.getTime() - today.getTime());
    vm.invoice.dateDueLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    vm.currencySymbols = {
      'USD': '$',
      'AUD': 'A$',
      'EURO': '€',
      'GBP': '£'
    };

    // Remove existing Invoice
    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.invoice.$remove($state.go('invoices.list'));
      }
    }

    // Save Invoice
    function save(isValid) {
      if (vm.invoice.tax == null) {
        vm.invoice.tax = 0;
      }

      if (vm.invoice.amountDue.amount == null) {
        vm.invoice.amountDue.amount = 0.0;
      }

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.invoiceForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.invoice._id) {
        vm.invoice.$update(successCallback, errorCallback);
      } else {
        vm.invoice.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('invoicesview', {
          invoiceId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());
