(function () {
  'use strict';


  angular
    .module('notifications')
    .controller('NotificationsController', NotificationsController);

  NotificationsController.$inject = ['$scope', '$state', '$http', 'Authentication', 'Socket'];

  function NotificationsController($scope, $state, $http, Authentication, Socket) {
    var vm = this;

    vm.messages = [];
    vm.messageText = '';
    vm.sendMessage = sendMessage;
    vm.authentication = Authentication;
    vm.isAnswered = true;
    init();

    function init() {
      // If user is not signed in then redirect back home
      if (!Authentication.user) {
        $state.go('home');
      }

      // Make sure the Socket is connected
      if (!Socket.socket) {
        Socket.connect();
      }

      // Add an event listener to the 'notificiationMessage' event
      Socket.on('invoiceclient', function (message) {
        vm.messages.unshift(message);
      });

      // Remove the event listener when the controller instance is destroyed
      $scope.$on('$destroy', function () {
        Socket.removeListener('invoiceclient');
      });
    }

    // Create a controller method for sending messages
    function sendMessage() {
      // Create a new message object
      var message = {
        text: vm.messageText,
        created: Date.now()
      };

      // Emit a 'chatMessage' message event
      Socket.emit('notificiationMessage', message);

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
