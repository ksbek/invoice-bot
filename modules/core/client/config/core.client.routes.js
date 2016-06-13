(function () {
  'use strict';

  angular
    .module('core.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

  function routeConfig($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.path();
      var hasTrailingSlash = path.length > 1 && path[path.length - 1] === '/';

      if (hasTrailingSlash) {
        // if last character is a slash, return the same url without the slash
        var newPath = path.substr(0, path.length - 1);
        $location.replace().path(newPath);
      }
    });

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    $stateProvider
      .state('root', {
        url: '',
        abstract: true,
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container': {
            template: '<ui-view/>'
          }
        }
      })
      .state('home', {
        url: '/',
        views: {
          'home@': {
            templateUrl: 'modules/core/client/views/home.client.view.html',
            controller: 'HomeController',
            controllerAs: 'vm'
          }
        }
      })
      .state('root.privacy', {
        url: '/privacy',
        templateUrl: 'modules/core/client/views/privacy.client.view.html',
        data: {
          ignoreState: true,
          pageTitle: 'Privacy'
        }
      })
      .state('not-found', {
        url: '/not-found',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/core/client/views/404.client.view.html'
          }
        },
        data: {
          ignoreState: true,
          pageTitle: 'Not-Found'
        }
      })
      .state('bad-request', {
        url: '/bad-request',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/core/client/views/400.client.view.html'
          }
        },
        data: {
          ignoreState: true,
          pageTitle: 'Bad-Request'
        }
      })
      .state('forbidden', {
        url: '/forbidden',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/core/client/views/403.client.view.html'
          }
        },
        data: {
          ignoreState: true,
          pageTitle: 'Forbidden'
        }
      });
  }
}());
