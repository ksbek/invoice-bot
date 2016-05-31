(function () {
  'use strict';

  // Invoices controller
  angular
    .module('invoices')
    .controller('InvoicesController', InvoicesController);

  InvoicesController.$inject = ['$scope', '$state', '$http', 'Authentication', 'invoiceResolve', 'ClientsService', '$uibModal', '$window'];

  function InvoicesController ($scope, $state, $http, Authentication, invoice, ClientsService, $uibModal, $window) {
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
    vm.invoice.dateIssued = new Date(vm.invoice.dateIssued);
    var today = new Date();
    var timeDiff = today.getTime() - vm.invoice.dateIssued.getTime();
    vm.dueDateAllowance = new Date(vm.invoice.dateIssued).getTime() - vm.invoice.dateIssued.getTime();
    vm.invoice.dueDays = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (vm.invoice.status === 'paid' && vm.invoice.datePaid) {
      timeDiff = Math.floor(Math.abs(today.getTime() - new Date(vm.invoice.datePaid).getTime()) / (1000 * 3600 * 24));
      if (timeDiff < 1)
        vm.invoice.paidDate = timeDiff + "d ago";
      else
        vm.invoice.paidDate = "Today";
    }

    if (vm.invoice.amountDue.currency === undefined || vm.invoice.amountDue.currency === "")
      vm.invoice.amountDue.currency = vm.authentication.user.currency || 'USD';
    if (vm.invoice.tax === undefined || vm.invoice.tax === 0)
      vm.invoice.tax = vm.authentication.user.tax || 0;
    vm.currencySymbols = {
      'USD': '$',
      'AUD': 'A$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$'
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
          vm.errorCode = "";

          vm.callOauthProvider = callOauthProvider;
          // OAuth provider request
          function callOauthProvider(url) {
            // Effectively call OAuth authentication route:
            $window.location.href = url;
          }

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
              if (response.code && response.code === 'not-stripe-connected')
                vm.errorCode = response.code;
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
