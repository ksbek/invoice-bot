(function () {
  'use strict';

  angular.module('core')
    .directive('pageDescription', pageDescription);

  pageDescription.$inject = ['$rootScope', '$timeout', '$interpolate', '$state'];

  function pageDescription($rootScope, $timeout, $interpolate, $state) {
    var directive = {
      retrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element) {
      $rootScope.$on('$stateChangeSuccess', listener);

      function listener(event, toState) {
        var description = (getDescription($state.$current));
        $timeout(function () {
          element[0].setAttribute('content', description);
        }, 0, false);
      }

      function getDescription(currentState) {
        var applicationCoreDescription = 'Instant invoicing for freelancers, startups and small teams. Nowdue is a conversational way to create, send and manage invoices super fast.';
        var workingState = currentState;
        if (currentState.data && currentState.data.pageDescription) {
          workingState = (typeof workingState.locals !== 'undefined') ? workingState.locals.globals : workingState;
          var stateDescription = $interpolate(currentState.data.pageDescription)(workingState);
          return stateDescription;
        } else {
          return applicationCoreDescription;
        }
      }
    }
  }
}());
