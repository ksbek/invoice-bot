(function () {
  'use strict';

  angular
    .module('users')
    .controller('InvoiceSettingsController', InvoiceSettingsController);

  InvoiceSettingsController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function InvoiceSettingsController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;
    vm.range = range;
    vm.changeDueDateAllowance = changeDueDateAllowance;
    vm.changeUserDueDateAllowance = changeUserDueDateAllowance;
    vm.changeTax = changeTax;
    vm.changeUserTax = changeUserTax;

    vm.dueDateAllowance = vm.user.dueDateAllowance.toString();
    vm.tax = vm.user.tax.toString();

    vm.currencySymbols = {
      'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
    };

    if (!vm.user.currency || vm.user.currency === "")
      vm.user.currency = 'USD';
    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
        $state.go('notifications');
      }, function (response) {
        vm.error = response.data.message;
      });
    }

    function range(n) {
      var foo = [];
      for (var i = 1; i <= n; i++) {
        foo.push(i);
      }
      return foo;
    }

    function changeDueDateAllowance() {
      vm.user.dueDateAllowance = parseInt(vm.dueDateAllowance, 10);
    }

    function changeUserDueDateAllowance() {
      vm.dueDateAllowance = vm.user.dueDateAllowance.toString();
    }

    function changeTax() {
      vm.user.tax = parseInt(vm.tax, 10);
    }

    function changeUserTax() {
      vm.tax = vm.user.tax.toString();
    }
  }
}());
