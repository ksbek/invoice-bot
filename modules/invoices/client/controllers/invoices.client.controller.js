(function () {
  'use strict';

  // Invoices controller
  angular
    .module('invoices')
    .controller('InvoicesController', InvoicesController);

  InvoicesController.$inject = ['$scope', '$state', '$http', 'Authentication', 'invoiceResolve', 'ClientsService', '$uibModal'];

  function InvoicesController ($scope, $state, $http, Authentication, invoice, ClientsService, $uibModal) {
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

    if (vm.invoice.status === 'paid' && vm.invoice.datePaid) {
      timeDiff = Math.ceil(Math.abs(today.getTime() - new Date(vm.invoice.datePaid).getTime()) / (1000 * 3600 * 24));
      if (timeDiff < 1)
        vm.invoice.paidDate = timeDiff + "Days ago";
      else
        vm.invoice.paidDate = "Today";
    }

    vm.currencySymbols = {
      'USD': '$USD',
      'AUD': '$AUD',
      'EUR': '€EURO',
      'GBP': '£UK',
      'CAD': '$CAD'
    };

    vm.payNow = payNow;

    // Remove existing Invoice
    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.invoice.$remove($state.go('invoices.list'));
      }
    }

    // Save Invoice
    function save(isValid) {
      if (vm.invoice.tax === null || vm.invoice.tax === "") {
        vm.invoice.tax = 0;
      }

      if (vm.invoice.amountDue.amount === null || vm.invoice.amountDue.amount === "") {
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

    // Pay Now
    function payNow(invoice) {
      var modalInstance = $uibModal.open({
        templateUrl: 'modules/invoices/client/views/pay-invoice.client.view.html',
        size: 'sm',
        windowClass: 'invoice-modal',
        backdrop: 'static',
        controller: ['$state', 'Authentication', 'invoice', function($scope, Authentication, invoice) {
          var vm = this;
          vm.invoice = invoice;
          vm.authentication = Authentication;
          vm.pay = pay;
          vm.details = {};

          function pay() {
            vm.error = "";
            vm.loading = true;
            $http.post('/api/invoices/' + vm.invoice._id + '/paynow', {
              params: {
                card: vm.details
              }
            }).success(function (response) {
              // If successful show success message and clear form
              vm.invoice.status = response.status;
              if (vm.invoice.status === 'paid')
                vm.invoice.paidDate = "Today";

              modalInstance.close();

              var modalSuccessInstance = $uibModal.open({
                templateUrl: 'modules/invoices/client/views/paid-invoice-modal.client.view.html',
                size: 'sm',
                windowClass: 'invoice-paid-success-modal'
              });
            }).error(function (response) {
              vm.loading = false;
              vm.error = response.message;
            });
          }
        }],
        controllerAs: 'vm',
        resolve: {
          invoice: invoice
        }
      });
    }
  }
}());
