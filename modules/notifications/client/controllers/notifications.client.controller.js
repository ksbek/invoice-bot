(function () {
  'use strict';


  angular
    .module('notifications')
    .controller('NotificationsController', NotificationsController);

  NotificationsController.$inject = ['$scope', '$state', '$rootScope', '$http', '$window', 'Authentication', 'NotificationsService'];

  function NotificationsController($scope, $state, $rootScope, $http, $window, Authentication, NotificationsService) {
    var vm = this;

    vm.messages = [];
    vm.messageText = '';
    vm.sendMessage = sendMessage;
    vm.authentication = Authentication;
    vm.isAnswered = true;
    init();

    vm.callOauthProvider = callOauthProvider;
    // OAuth provider request
    function callOauthProvider(url) {
      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }

    vm.notifications = NotificationsService.query();

    function init() {
      // If user is not signed in then redirect back home
      if (!Authentication.user) {
        $state.go('home');
      }
    }

    // Create a controller method for sending messages
    function sendMessage() {
      // Create a new message object
      var message = {
        text: vm.messageText,
        created: Date.now()
      };
      vm.isAnswered = false;

      vm.messages.push(message);
      $http.post('/api/notifications/apiai', message).success(function (response) {
        // If successful we assign the response to the global user model
        vm.messages[vm.messages.length - 1].responseText = response.result.fulfillment.speech;
        vm.isAnswered = true;

      }).error(function (response) {
        vm.error = response.message;
      });

      // Clear the message text
      vm.messageText = '';
    }

    /*
    // Create a controller method for sending messages
    function sendMessage() {
      // Create a new message object
      var message = {
        text: vm.messageText,
        created: Date.now()
      };

      vm.isAnswered = false;

      vm.messages.push(message);

      $http.post('/api/notifications/apiai', message).success(function (response) {
        // If successful we assign the response to the global user model
        vm.messages[vm.messages.length - 1].responseText = response.result.fulfillment.speech;
        vm.isAnswered = true;

      }).error(function (response) {
        vm.error = response.message;
      });

      vm.messageText = '';
    }
    */
  }
}());

angular
  .module('notifications').filter('unsafe', function($sce) { return $sce.trustAsHtml; });
