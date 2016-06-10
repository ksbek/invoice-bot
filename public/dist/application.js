(function (window) {
  'use strict';

  var applicationModuleName = 'nowdue';

  var service = {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: ['ngResource', 'ngAnimate', 'ngMessages', 'ui.router', 'ui.bootstrap', 'angularFileUpload'],
    registerModule: registerModule
  };

  window.ApplicationConfiguration = service;

  // Add a new vertical module
  function registerModule(moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  }
}(window));

(function (app) {
  'use strict';

  // Start by defining the main module and adding the module dependencies
  angular
    .module(app.applicationModuleName, app.applicationModuleVendorDependencies);

  // Setting HTML5 Location Mode
  angular
    .module(app.applicationModuleName)
    .config(bootstrapConfig);
    // .run(function ($rootScope, $localForage) {
      // $localForage.getItem('messages').then(function(data) {
      // if (!data)
      //    $rootScope.messages = new Array();
      //  else
      //    $rootScope.messages = JSON.parse(data);
      // });
    // });

  function bootstrapConfig($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }

  bootstrapConfig.$inject = ['$locationProvider', '$httpProvider'];

  // Then define the init function for starting up the application
  angular.element(document).ready(init);

  function init() {
    // Fixing facebook bug with redirect
    if (window.location.hash && window.location.hash === '#_=_') {
      if (window.history && history.pushState) {
        window.history.pushState('', document.title, window.location.pathname);
      } else {
        // Prevent scrolling by storing the page's current scroll offset
        var scroll = {
          top: document.body.scrollTop,
          left: document.body.scrollLeft
        };
        window.location.hash = '';
        // Restore the scroll offset, should be flicker free
        document.body.scrollTop = scroll.top;
        document.body.scrollLeft = scroll.left;
      }
    }

    // Then init the app
    angular.bootstrap(document, [app.applicationModuleName]);
  }
}(ApplicationConfiguration));

(function (app) {
  'use strict';

  app.registerModule('clients', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('clients.services');
  app.registerModule('clients.routes', ['ui.router', 'core.routes', 'clients.services']);
}(ApplicationConfiguration));

(function (app) {
  'use strict';

  app.registerModule('core');
  app.registerModule('core.routes', ['ui.router']);
  app.registerModule('core.admin', ['core']);
  app.registerModule('core.admin.routes', ['ui.router']);
}(ApplicationConfiguration));

(function (app) {
  'use strict';

  app.registerModule('invoices');
}(ApplicationConfiguration));

(function (app) {
  'use strict';

  app.registerModule('notifications', ['core']);
  app.registerModule('notifications.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));

(function (app) {
  'use strict';

  app.registerModule('users');
  app.registerModule('users.admin');
  app.registerModule('users.admin.routes', ['ui.router', 'core.routes', 'users.admin.services']);
  app.registerModule('users.admin.services');
  app.registerModule('users.routes', ['ui.router', 'core.routes']);
  app.registerModule('users.services');
}(ApplicationConfiguration));

(function () {
  'use strict';

  angular
    .module('clients')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Clients',
      state: 'clients.list',
      roles: ['user', 'admin'],
      position: 3
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('clients')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('clients', {
        abstract: true,
        url: '/clients',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            template: '<ui-view/>'
          }
        }
      })
      .state('clients.list', {
        url: '',
        templateUrl: 'modules/clients/client/views/list-clients.client.view.html',
        controller: 'ClientsListController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Clients List'
        }
      })
      .state('clients.create', {
        url: '/create',
        templateUrl: 'modules/clients/client/views/form-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: newClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Clients Create'
        }
      })
      .state('clients.edit', {
        url: '/:clientId/edit',
        templateUrl: 'modules/clients/client/views/form-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: getClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Client {{ clientResolve.name }}'
        }
      })
      .state('clients.view', {
        url: '/:clientId',
        templateUrl: 'modules/clients/client/views/view-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: getClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Client {{ articleResolve.name }}'
        }
      });
  }

  getClient.$inject = ['$stateParams', 'ClientsService'];

  function getClient($stateParams, ClientsService) {
    return ClientsService.get({
      clientId: $stateParams.clientId
    }).$promise;
  }

  newClient.$inject = ['ClientsService'];

  function newClient(ClientsService) {
    return new ClientsService();
  }
}());

(function () {
  'use strict';

  // Clients controller
  angular
    .module('clients')
    .controller('ClientsController', ClientsController);

  ClientsController.$inject = ['$scope', '$state', 'Authentication', 'clientResolve'];

  function ClientsController ($scope, $state, Authentication, client) {
    var vm = this;

    vm.authentication = Authentication;
    vm.client = client;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Client
    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.client.$remove($state.go('clients.list'));
      }
    }

    // Save Client
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.clientForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.client._id) {
        vm.client.$update(successCallback, errorCallback);
      } else {
        vm.client.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('clients.list');
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('clients')
    .controller('ClientsListController', ClientsListController);

  ClientsListController.$inject = ['ClientsService', 'Authentication'];

  function ClientsListController(ClientsService, Authentication) {
    var vm = this;
    vm.authentication = Authentication;
    vm.clients = ClientsService.query();
    vm.saveClient = saveClient;
    vm.edit = edit;
    vm.exitEdit = exitEdit;
    vm.editRow = -1;

    // Save Client
    function saveClient(client) {
      // TODO: move create/update logic to service
      if (client._id) {
        client.$update(successCallback, errorCallback);
      } else {
        client.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
        vm.tempClient = null;
      }

      function errorCallback(res) {
        vm.error = res.data.message;
        vm.editRow = -1;
        vm.tempClient = null;
      }
    }

    function edit(client, row) {
      if (vm.editRow !== -1)
        return;
      vm.editRow = row;
      vm.tempClient = angular.copy(client);
    }

    function exitEdit(client, row) {
      vm.editRow = -1;
      vm.clients[row] = vm.tempClient;
      vm.tempClient = null;
    }
  }
}());

// Clients service used to communicate Clients REST endpoints
(function () {
  'use strict';

  angular
    .module('clients')
    .factory('ClientsService', ClientsService);

  ClientsService.$inject = ['$resource'];

  function ClientsService($resource) {
    return $resource('api/clients/:clientId', {
      clientId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('core.admin')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
  }
}());

(function () {
  'use strict';

  angular
    .module('core.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
}());

(function () {
  'use strict';

  angular
    .module('core')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    Menus.addMenu('account', {
      roles: ['user']
    });

    Menus.addMenuItem('account', {
      title: '',
      state: 'settings',
      type: 'dropdown',
      roles: ['user']
    });

    Menus.addSubMenuItem('account', 'settings', {
      title: 'Edit Profile',
      state: 'settings.profile'
    });

    Menus.addSubMenuItem('account', 'settings', {
      title: 'Edit Profile Picture',
      state: 'settings.picture'
    });

    Menus.addSubMenuItem('account', 'settings', {
      title: 'Change Password',
      state: 'settings.password'
    });

    Menus.addSubMenuItem('account', 'settings', {
      title: 'Manage Social Accounts',
      state: 'settings.accounts'
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('core')
    .run(routeFilter);

  routeFilter.$inject = ['$rootScope', '$state', 'Authentication'];

  function routeFilter($rootScope, $state, Authentication) {
    $rootScope.$on('$stateChangeStart', stateChangeStart);
    $rootScope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeStart(event, toState, toParams, fromState, fromParams) {
      // Check authentication before changing state
      if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
        var allowed = false;

        for (var i = 0, roles = toState.data.roles; i < roles.length; i++) {
          if ((roles[i] === 'guest') || (Authentication.user && Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(roles[i]) !== -1)) {
            allowed = true;
            break;
          }
        }

        if (!allowed) {
          event.preventDefault();
          if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
            $state.transitionTo('forbidden');
          } else {
            $state.go('authentication.signin').then(function () {
              // Record previous state
              storePreviousState(toState, toParams);
            });
          }
        }
      }
    }

    function stateChangeSuccess(event, toState, toParams, fromState, fromParams) {
      // Record previous state
      if (Authentication.user) {
        if (toState.name === 'root.home') {
          $state.transitionTo('notifications').then(function () {
            // Record previous state
            storePreviousState(toState, toParams);
          });
        }
      }
      storePreviousState(fromState, fromParams);
    }

    // Store previous state
    function storePreviousState(state, params) {
      // only store this state if it shouldn't be ignored
      if (!state.data || !state.data.ignoreState) {
        $state.previous = {
          state: state,
          params: params,
          href: $state.href(state, params)
        };
      }
    }
  }
}());

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
      .state('root.home', {
        url: '/',
        templateUrl: 'modules/core/client/views/home.client.view.html',
        controller: 'HomeController',
        controllerAs: 'vm'
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

(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', '$rootScope', 'Authentication', 'Menus', '$uibModal', 'Socket', '$window'];

  function HeaderController($scope, $state, $rootScope, Authentication, Menus, $uibModal, Socket, $window) {
    var vm = this;

    vm.accountMenu = Menus.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = Menus.getMenu('topbar');
    vm.createClient = createClient;
    vm.state = $state;
    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    init();

    vm.callOauthProvider = callOauthProvider;
    // OAuth provider request
    function callOauthProvider(url) {
      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }

    function stateChangeSuccess() {
      // Collapsing the menu after navigation
      vm.isCollapsed = false;
    }

    function createClient() {
      var modalInstance = $uibModal.open({
        templateUrl: 'modules/clients/client/views/new-client.client.view.html',
        size: 'lg',
        windowClass: 'client-modal',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: newClient
        }
      });
    }

    function init() {
      // Make sure the Socket is connected
      if (!Socket.socket) {
        Socket.connect();
      }

      // Add an event listener to the 'notificiationMessage' event
      Socket.on(Authentication.user.id + 'notification', function (message) {
        // $rootScope.messages.push(message.notification);
        // $localForage.setItem('messages', JSON.stringify($rootScope.messages)).then(function() {
        //  $localForage.getItem('messages').then(function(data) {
        //    $rootScope.messages = JSON.parse(data);
        //  });
        // });
      });
    }

    newClient.$inject = ['ClientsService'];

    function newClient(ClientsService) {
      return new ClientsService();
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', '$http', '$location', '$window'];

  function HomeController($scope, $state, $http, $location, $window) {
    var vm = this;
    vm.callOauthProvider = callOauthProvider;
    // OAuth provider request
    function callOauthProvider(url) {
      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }
  }
}());

(function () {
  'use strict';

  angular.module('core')
    .directive('pageTitle', pageTitle);

  pageTitle.$inject = ['$rootScope', '$timeout', '$interpolate', '$state'];

  function pageTitle($rootScope, $timeout, $interpolate, $state) {
    var directive = {
      retrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element) {
      $rootScope.$on('$stateChangeSuccess', listener);

      function listener(event, toState) {
        var title = (getTitle($state.$current));
        $timeout(function () {
          element.text(title);
        }, 0, false);
      }

      function getTitle(currentState) {
        var applicationCoreTitle = 'Nowdue';
        var workingState = currentState;
        if (currentState.data) {
          workingState = (typeof workingState.locals !== 'undefined') ? workingState.locals.globals : workingState;
          var stateTitle = $interpolate(currentState.data.pageTitle)(workingState);
          return applicationCoreTitle + ' - ' + stateTitle;
        } else {
          return applicationCoreTitle;
        }
      }
    }
  }
}());

(function () {
  'use strict';

  // https://gist.github.com/rhutchison/c8c14946e88a1c8f9216

  angular
    .module('core')
    .directive('showErrors', showErrors);

  showErrors.$inject = ['$timeout', '$interpolate'];

  function showErrors($timeout, $interpolate) {
    var directive = {
      restrict: 'A',
      require: '^form',
      compile: compile
    };

    return directive;

    function compile(elem, attrs) {
      if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
        if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
          throw new Error('show-errors element does not have the \'form-group\' or \'input-group\' class');
        }
      }

      return linkFn;

      function linkFn(scope, el, attrs, formCtrl) {
        var inputEl,
          inputName,
          inputNgEl,
          options,
          showSuccess,
          initCheck = false,
          showValidationMessages = false;

        options = scope.$eval(attrs.showErrors) || {};
        showSuccess = options.showSuccess || false;
        inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
        inputNgEl = angular.element(inputEl);
        inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

        if (!inputName) {
          throw new Error('show-errors element has no child input elements with a \'name\' attribute class');
        }

        scope.$watch(function () {
          return formCtrl[inputName] && formCtrl[inputName].$invalid;
        }, toggleClasses);

        scope.$on('show-errors-check-validity', checkValidity);
        scope.$on('show-errors-reset', reset);

        function checkValidity(event, name) {
          if (angular.isUndefined(name) || formCtrl.$name === name) {
            initCheck = true;
            showValidationMessages = true;

            return toggleClasses(formCtrl[inputName].$invalid);
          }
        }

        function reset(event, name) {
          if (angular.isUndefined(name) || formCtrl.$name === name) {
            return $timeout(function () {
              el.removeClass('has-error');
              el.removeClass('has-success');
              showValidationMessages = false;
            }, 0, false);
          }
        }

        function toggleClasses(invalid) {
          el.toggleClass('has-error', showValidationMessages && invalid);

          if (showSuccess) {
            return el.toggleClass('has-success', showValidationMessages && !invalid);
          }
        }
      }
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('core')
    .factory('authInterceptor', authInterceptor);

  authInterceptor.$inject = ['$q', '$injector', 'Authentication'];

  function authInterceptor($q, $injector, Authentication) {
    var service = {
      responseError: responseError
    };

    return service;

    function responseError(rejection) {
      if (!rejection.config.ignoreAuthModule) {
        switch (rejection.status) {
          case 401:
            // Deauthenticate the global user
            Authentication.user = null;
            $injector.get('$state').transitionTo('authentication.signin');
            break;
          case 403:
            $injector.get('$state').transitionTo('forbidden');
            break;
        }
      }
      // otherwise, default behaviour
      return $q.reject(rejection);
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('core')
    .factory('Menus', Menus);

  function Menus() {
    var shouldRender;
    var service = {
      addMenu: addMenu,
      addMenuItem: addMenuItem,
      addSubMenuItem: addSubMenuItem,
      defaultRoles: ['user', 'admin'],
      getMenu: getMenu,
      menus: {},
      removeMenu: removeMenu,
      removeMenuItem: removeMenuItem,
      removeSubMenuItem: removeSubMenuItem,
      validateMenuExistance: validateMenuExistance
    };

    init();

    return service;

    // Add new menu object by menu id
    function addMenu(menuId, options) {
      options = options || {};

      // Create the new menu
      service.menus[menuId] = {
        roles: options.roles || service.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return service.menus[menuId];
    }

    // Add menu item object
    function addMenuItem(menuId, options) {
      options = options || {};

      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      // Push new menu item
      service.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? service.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          if (options.items.hasOwnProperty(i)) {
            service.addSubMenuItem(menuId, options.state, options.items[i]);
          }
        }
      }

      // Return the menu object
      return service.menus[menuId];
    }

    // Add submenu item object
    function addSubMenuItem(menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in service.menus[menuId].items) {
        if (service.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          service.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? service.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return service.menus[menuId];
    }

    // Get the menu object by menu id
    function getMenu(menuId) {
      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      // Return the menu object
      return service.menus[menuId];
    }

    function init() {
      // A private function for rendering decision
      shouldRender = function (user) {
        if (this.roles.indexOf('*') !== -1) {
          return true;
        } else {
          if (!user) {
            return false;
          }

          for (var userRoleIndex in user.roles) {
            if (user.roles.hasOwnProperty(userRoleIndex)) {
              for (var roleIndex in this.roles) {
                if (this.roles.hasOwnProperty(roleIndex) && this.roles[roleIndex] === user.roles[userRoleIndex]) {
                  return true;
                }
              }
            }
          }
        }

        return false;
      };

      // Adding the topbar menu
      addMenu('topbar', {
        roles: ['*']
      });
    }

    // Remove existing menu object by menu id
    function removeMenu(menuId) {
      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      delete service.menus[menuId];
    }

    // Remove existing menu object by menu id
    function removeMenuItem(menuId, menuItemState) {
      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in service.menus[menuId].items) {
        if (service.menus[menuId].items.hasOwnProperty(itemIndex) && service.menus[menuId].items[itemIndex].state === menuItemState) {
          service.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return service.menus[menuId];
    }

    // Remove existing menu object by menu id
    function removeSubMenuItem(menuId, submenuItemState) {
      // Validate that the menu exists
      service.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in service.menus[menuId].items) {
        if (this.menus[menuId].items.hasOwnProperty(itemIndex)) {
          for (var subitemIndex in service.menus[menuId].items[itemIndex].items) {
            if (this.menus[menuId].items[itemIndex].items.hasOwnProperty(subitemIndex) && service.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
              service.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
            }
          }
        }
      }

      // Return the menu object
      return service.menus[menuId];
    }

    // Validate menu existance
    function validateMenuExistance(menuId) {
      if (menuId && menuId.length) {
        if (service.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }
    }
  }
}());

(function () {
  'use strict';

  // Create the Socket.io wrapper service
  angular
    .module('core')
    .factory('Socket', Socket);

  Socket.$inject = ['Authentication', '$state', '$timeout'];

  function Socket(Authentication, $state, $timeout) {
    var service = {
      connect: connect,
      emit: emit,
      on: on,
      removeListener: removeListener,
      socket: null
    };

    connect();

    return service;

    // Connect to Socket.io server
    function connect() {
      // Connect only when authenticated
      if (Authentication.user) {
        service.socket = io();
      }
    }

    // Wrap the Socket.io 'emit' method
    function emit(eventName, data) {
      if (service.socket) {
        service.socket.emit(eventName, data);
      }
    }

    // Wrap the Socket.io 'on' method
    function on(eventName, callback) {
      if (service.socket) {
        service.socket.on(eventName, function (data) {
          $timeout(function () {
            callback(data);
          });
        });
      }
    }

    // Wrap the Socket.io 'removeListener' method
    function removeListener(eventName) {
      if (service.socket) {
        service.socket.removeListener(eventName);
      }
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('invoices')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Invoices',
      state: 'invoices.list',
      roles: ['user', 'admin'],
      position: 2
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('invoices')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('invoices', {
        abstract: true,
        url: '/invoices',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            template: '<ui-view/>'
          }
        }
      })
      .state('invoices.list', {
        url: '',
        templateUrl: 'modules/invoices/client/views/list-invoices.client.view.html',
        controller: 'InvoicesListController',
        controllerAs: 'vm',
        resolve: {
          invoices: getInvoices
        },
        data: {
          pageTitle: 'Invoices List'
        }
      })
      .state('invoices.listByClient', {
        url: '/client/:clientId',
        templateUrl: 'modules/invoices/client/views/list-invoices.client.view.html',
        controller: 'InvoicesListByClientController',
        controllerAs: 'vm',
        resolve: {
          invoices: getInvoiceByClient
        },
        data: {
          pageTitle: 'Invoices List'
        }
      })
      .state('invoices.create', {
        url: '/create',
        templateUrl: 'modules/invoices/client/views/form-invoice.client.view.html',
        controller: 'InvoicesController',
        controllerAs: 'vm',
        resolve: {
          invoiceResolve: newInvoice
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Invoices Create'
        }
      })
      .state('invoices.edit', {
        url: '/:invoiceId/edit',
        templateUrl: 'modules/invoices/client/views/form-invoice.client.view.html',
        controller: 'InvoicesController',
        controllerAs: 'vm',
        resolve: {
          invoiceResolve: getInvoice
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Invoice {{ invoiceResolve.name }}'
        }
      })
      .state('invoicesview', {
        url: '/invoices/:invoiceId',
        views: {
          'container@': {
            templateUrl: 'modules/invoices/client/views/view-invoice.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          },
          'header': {
            templateUrl: 'modules/invoices/client/views/invoice-view-header.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          },
          'footer': {
            templateUrl: 'modules/invoices/client/views/invoice-view-footer.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          }
        },
        resolve: {
          invoiceResolve: getInvoice
        },
        data: {
          pageTitle: 'Invoice View'
        }
      });
  }

  getInvoice.$inject = ['$stateParams', 'InvoicesService'];

  function getInvoice($stateParams, InvoicesService) {
    return InvoicesService.get({
      invoiceId: $stateParams.invoiceId
    }).$promise;
  }

  newInvoice.$inject = ['InvoicesService'];

  function newInvoice(InvoicesService) {
    return new InvoicesService();
  }

  getInvoices.$inject = ['InvoicesService'];

  function getInvoices(InvoicesService) {
    return InvoicesService.query().$promise;
  }

  getInvoiceByClient.$inject = ['$stateParams', '$http'];

  function getInvoiceByClient($stateParams, $http) {
    return $http.post('/api/invoices/client/' + $stateParams.clientId, {
      params: {
        clientId: $stateParams.clientId
      }
    });
  }
}());

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

    // Initialize values
    vm.authentication = Authentication;
    vm.invoice = invoice;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.invoice.dateIssued = new Date(vm.invoice.dateIssued);
    vm.invoice.dateDue = new Date(vm.invoice.dateDue);
    var today = new Date();
    var timeDiff = today.getTime() - vm.invoice.dateIssued.getTime();
    vm.dueDateAllowance = Math.floor((vm.invoice.dateDue.getTime() - vm.invoice.dateIssued.getTime()) / (1000 * 3600 * 24));
    vm.invoice.dueDays = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (vm.invoice.status === 'paid' && vm.invoice.datePaid) {
      timeDiff = Math.floor(Math.abs(today.getTime() - new Date(vm.invoice.datePaid).getTime()) / (1000 * 3600 * 24));
      if (timeDiff >= 1)
        vm.invoice.paidDate = timeDiff + "d ago";
      else
        vm.invoice.paidDate = "Today";
    }

    if (vm.invoice.amountDue.currency === undefined || vm.invoice.amountDue.currency === "")
      vm.invoice.amountDue.currency = vm.authentication.user.currency || 'USD';
    if (vm.invoice.tax === undefined || vm.invoice.tax === 0)
      vm.invoice.tax = vm.authentication.user.tax || 0;

    vm.currencySymbols = {
      'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
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
          vm.currencySymbols = {
            'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
          };

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

(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListByClientController', InvoicesListByClientController);

  InvoicesListByClientController.$inject = ['InvoicesService', '$uibModal', '$http', 'Authentication', 'invoices'];

  function InvoicesListByClientController(InvoicesService, $uibModal, $http, Authentication, invoices) {
    var vm = this;
    vm.authentication = Authentication;
    vm.currencySymbols = {
      'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
    };


    vm.invoices = invoices.data;

    for (var i = 0; i < vm.invoices.length; i ++) {
      var dueDays = Math.floor((new Date().getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.floor((new Date(vm.invoices[i].dateDue).getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      if (vm.invoices[i].status !== 'paid') {
        if (dueDays < dueDateAllowance || dueDateAllowance === 0)
          vm.invoices[i].status = "due";
        else
          vm.invoices[i].status = "overdue";
        vm.invoices[i].dateDue = new Date(vm.invoices[i].dateDue);
      }
    }

    vm.saveInvoice = saveInvoice;
    vm.exitEdit = exitEdit;
    vm.edit = edit;
    vm.editRow = -1;

    // Save Invoice
    function saveInvoice(invoice) {
      // TODO: move create/update logic to service
      vm.editRow = -1;
      vm.tempInvoice = null;

      if (invoice._id) {
        new InvoicesService(invoice).$update(successCallback, errorCallback);
      } else {
        new InvoicesService(invoice).$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
        var dueDays = Math.floor((new Date().getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        var dueDateAllowance = Math.floor((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        if (invoice.status !== 'paid') {
          if (dueDays < dueDateAllowance || dueDateAllowance === 0)
            invoice.status = "due";
          else
            invoice.status = "overdue";
          invoice.dateDue = new Date(invoice.dateDue);
        }
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    function edit(invoice, row) {
      if (vm.editRow !== -1)
        return;
      vm.editRow = row;
      invoice.dateDue = new Date(invoice.dateDue);
      vm.tempInvoice = angular.copy(invoice);
    }

    function exitEdit(invoice, row) {
      vm.editRow = -1;
      vm.invoices[row] = vm.tempInvoice;
      vm.tempInvoice = null;
    }
  }
}());

(function () {
  'use strict';

  angular
  .module('invoices')
  .controller('InvoicesListController', InvoicesListController);

  InvoicesListController.$inject = ['InvoicesService', '$uibModal', 'Authentication', 'invoices'];

  function InvoicesListController(InvoicesService, $uibModal, Authentication, invoices) {
    var vm = this;
    vm.authentication = Authentication;
    vm.currencySymbols = {
      'USD': '$', 'AUD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$', 'ALL': 'Lek', 'ARS': '$', 'AWG': 'ƒ', 'BSD': '$', 'BBD': '$', 'BYR': 'p.', 'BZD': 'BZ$', 'BMD': '$', 'BOB': '$b', 'BAM': 'KM', 'BWP': 'P', 'BGN': 'лв', 'BRL': 'R$', 'BND': '$', 'KHR': '៛', 'KYD': '$', 'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'HRK': 'kn', 'CUP': '₱', 'CZK': 'Kč', 'DKK': 'kr', 'DOP': 'RD$', 'XCD': '$', 'EGP': '£', 'SVC': '$', 'FKP': '£', 'FJD': '$', 'GHS': '¢', 'GIP': '£', 'GTQ': 'Q', 'GGP': '£', 'GYD': '$', 'HNL': 'L', 'HKD': '$', 'HUF': 'Ft', 'ISK': 'kr', 'IDR': 'Rp', 'IRR': '﷼  ﷼', 'IMP': '£', 'ILS': '₪', 'JMD': 'J$', 'JPY': '¥', 'JEP': '£', 'KZT': 'лв', 'KRW': '₩', 'KGS': 'лв', 'LAK': '₭', 'LBP': '£', 'LRD': '$', 'MKD': 'ден', 'MYR': 'RM', 'MUR': '₨', 'MXN': '$', 'MNT': '₮', 'MZN': 'MT', 'NAD': '$', 'NPR': '₨', 'ANG': 'ƒ', 'NZD': '$', 'NIO': 'C$', 'NGN': '₦', 'NOK': 'kr', 'OMR': '﷼', 'PKR': '₨', 'PAB': 'B/.', 'PYG': 'Gs', 'PEN': 'S/.', 'PHP': '₱', 'PLN': 'zł', 'QAR': '﷼  ﷼', 'RON': 'lei', 'RUB': 'руб', 'SHP': '£', 'SAR': '﷼ ﷼', 'RSD': 'Дин.', 'SCR': '₨', 'SGD': '$', 'SBD': '$', 'SOS': 'S', 'ZAR': 'R', 'LKR': '₨', 'SEK': 'kr', 'CHF': 'CHF', 'SRD': '$', 'SYP': '£', 'TWD': 'NT$', 'THB': '฿', 'TTD': 'TT$', 'TVD': '$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'лв', 'VEF': 'Bs', 'VND': '₫', 'YER': '﷼', 'ZWD': 'Z$'
    };

    vm.invoices = invoices;

    for (var i = 0; i < vm.invoices.length; i ++) {
      var dueDays = Math.floor((new Date().getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      var dueDateAllowance = Math.floor((new Date(vm.invoices[i].dateDue).getTime() - new Date(vm.invoices[i].dateIssued).getTime()) / (1000 * 3600 * 24));
      if (vm.invoices[i].status !== 'paid') {
        if (dueDays < dueDateAllowance || dueDateAllowance === 0)
          vm.invoices[i].status = "due";
        else
          vm.invoices[i].status = "overdue";
        vm.invoices[i].dateDue = new Date(vm.invoices[i].dateDue);
      }
    }

    vm.saveInvoice = saveInvoice;
    vm.exitEdit = exitEdit;
    vm.edit = edit;
    vm.editRow = -1;

    // Save Invoice
    function saveInvoice(invoice) {
      // TODO: move create/update logic to service
      if (invoice._id) {
        invoice.$update(successCallback, errorCallback);
      } else {
        invoice.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
        invoice = res;
        vm.tempInvoice = null;
        var dueDays = Math.floor((new Date().getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        var dueDateAllowance = Math.floor((new Date(invoice.dateDue).getTime() - new Date(invoice.dateIssued).getTime()) / (1000 * 3600 * 24));
        if (invoice.status !== 'paid') {
          if (dueDays < dueDateAllowance || dueDateAllowance === 0)
            invoice.status = "due";
          else
            invoice.status = "overdue";
          invoice.dateDue = new Date(invoice.dateDue);
        }
      }

      function errorCallback(res) {
        vm.error = res.data.message;
        vm.editRow = -1;
        vm.tempInvoice = null;
      }
    }

    function edit(invoice, row) {
      if (vm.editRow !== -1)
        return;
      vm.editRow = row;
      invoice.dateDue = new Date(invoice.dateDue);
      vm.tempInvoice = angular.copy(invoice);
    }

    function exitEdit(invoice, row) {
      vm.editRow = -1;
      var index = vm.invoices.findIndex(
        function(inv) {
          return inv._id === invoice._id;
        });
      vm.invoices[index] = vm.tempInvoice;
      vm.tempInvoice = null;
    }
  }
}());

// Invoices service used to communicate Invoices REST endpoints
(function () {
  'use strict';

  angular
    .module('invoices')
    .factory('InvoicesService', InvoicesService);

  InvoicesService.$inject = ['$resource'];

  function InvoicesService($resource) {
    return $resource('api/invoices/:invoiceId', {
      invoiceId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('notifications')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Notifications',
      state: 'notifications',
      roles: ['user'],
      position: 1
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('notifications.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('notifications', {
        url: '/',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/notifications/client/views/notifications.client.view.html',
            controller: 'NotificationsController',
            controllerAs: 'vm'
          }
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'notifications'
        }
      });
  }
}());

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
        vm.isAnswered = true;

      }).error(function (response) {
        vm.error = response.message;
      });

      // Clear the message text
      vm.messageText = '';

      $window.open(Authentication.user.providerData.url + 'messages/@nowdue/', '_blank');
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
  .module('notifications').filter('unsafe', ["$sce", function($sce) { return $sce.trustAsHtml; }]);

// Invoices service used to communicate Invoices REST endpoints
(function () {
  'use strict';

  angular
    .module('notifications')
    .factory('NotificationsService', NotificationsService);

  NotificationsService.$inject = ['$resource'];

  function NotificationsService($resource) {
    return $resource('api/notifications/:notificationId', {
      notificationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());

(function () {
  'use strict';

  angular
    .module('users.admin')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  // Configuring the Users module
  function menuConfig(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users'
    });
  }
}());

(function () {
  'use strict';

  // Setting up route
  angular
    .module('users.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Users List'
        }
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser
        },
        data: {
          pageTitle: 'Edit {{ userResolve.displayName }}'
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        controllerAs: 'vm',
        resolve: {
          userResolve: getUser
        },
        data: {
          pageTitle: 'Edit User {{ userResolve.displayName }}'
        }
      });

    getUser.$inject = ['$stateParams', 'AdminService'];

    function getUser($stateParams, AdminService) {
      return AdminService.get({
        userId: $stateParams.userId
      }).$promise;
    }
  }
}());

(function () {
  'use strict';

  // Setting up route
  angular
    .module('users.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    // Users state routing
    $stateProvider
      .state('settings', {
        abstract: true,
        url: '/settings',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
            controller: 'SettingsController',
            controllerAs: 'vm'
          }
        },
        controller: 'SettingsController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html',
        controller: 'EditProfileController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings'
        }
      })
      .state('settings.conversation', {
        url: '/conversation-settings',
        templateUrl: 'modules/users/client/views/settings/conversation-settings.client.view.html',
        controller: 'ConversationSettingsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings conversation'
        }
      })
      .state('settings.invoice', {
        url: '/invoice-settings',
        templateUrl: 'modules/users/client/views/settings/invoice-settings.client.view.html',
        controller: 'InvoiceSettingsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings invoice'
        }
      })
      .state('settings.plans', {
        url: '/plans',
        templateUrl: 'modules/users/client/views/settings/plans.client.view.html',
        controller: 'PlansController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings plans'
        }
      })
      .state('settings.pricing', {
        url: '/pricing',
        templateUrl: 'modules/users/client/views/settings/pricing.client.view.html',
        controller: 'PlansController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings Pricing'
        }
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html',
        controller: 'ChangePasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings password'
        }
      })
      .state('settings.integrations', {
        url: '/integrations',
        templateUrl: 'modules/users/client/views/settings/manage-integrations.client.view.html',
        controller: 'ManageIntegrationsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings integrations'
        }
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html',
        controller: 'ChangeProfilePictureController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Settings picture'
        }
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          }
        },
        controller: 'AuthenticationController',
        controllerAs: 'vm'
      })
      .state('authentication.signup', {
        url: '/signup',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/authentication/signup.client.view.html',
            controller: 'AuthenticationController',
            controllerAs: 'vm'
          }
        },
        data: {
          pageTitle: 'signup'
        }
      })
      .state('authentication.accountSetup', {
        url: '/account-setup',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/authentication/account-setup.client.view.html',
            controller: 'AuthenticationController',
            controllerAs: 'vm'
          }
        },
        data: {
          pageTitle: 'Account Setup'
        }
      })
      .state('authentication.signin', {
        url: '/signin?err',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/authentication/signin.client.view.html',
            controller: 'AuthenticationController',
            controllerAs: 'vm'
          }
        },
        data: {
          pageTitle: 'Signin'
        }
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html',
        controller: 'PasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Password forgot'
        }
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html',
        data: {
          pageTitle: 'Password reset invalid'
        }
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html',
        data: {
          pageTitle: 'Password reset success'
        }
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html',
        controller: 'PasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Password reset form'
        }
      });
  }
}());

(function () {
  'use strict';

  angular
    .module('users.admin')
    .controller('UserListController', UserListController);

  UserListController.$inject = ['$scope', '$filter', 'AdminService'];

  function UserListController($scope, $filter, AdminService) {
    var vm = this;
    vm.buildPager = buildPager;
    vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
    vm.pageChanged = pageChanged;

    AdminService.query(function (data) {
      vm.users = data;
      vm.buildPager();
    });

    function buildPager() {
      vm.pagedItems = [];
      vm.itemsPerPage = 15;
      vm.currentPage = 1;
      vm.figureOutItemsToDisplay();
    }

    function figureOutItemsToDisplay() {
      vm.filteredItems = $filter('filter')(vm.users, {
        $: vm.search
      });
      vm.filterLength = vm.filteredItems.length;
      var begin = ((vm.currentPage - 1) * vm.itemsPerPage);
      var end = begin + vm.itemsPerPage;
      vm.pagedItems = vm.filteredItems.slice(begin, end);
    }

    function pageChanged() {
      vm.figureOutItemsToDisplay();
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users.admin')
    .controller('UserController', UserController);

  UserController.$inject = ['$scope', '$state', '$window', 'Authentication', 'userResolve'];

  function UserController($scope, $state, $window, Authentication, user) {
    var vm = this;

    vm.authentication = Authentication;
    vm.user = user;
    vm.remove = remove;
    vm.update = update;

    function remove(user) {
      if ($window.confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          vm.users.splice(vm.users.indexOf(user), 1);
        } else {
          vm.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    }

    function update(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      var user = vm.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        vm.error = errorResponse.data.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('AuthenticationController', AuthenticationController);

  AuthenticationController.$inject = ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator'];

  function AuthenticationController($scope, $state, $http, $location, $window, Authentication, PasswordValidator) {
    var vm = this;

    vm.authentication = Authentication;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;
    vm.signup = signup;
    vm.signin = signin;
    vm.callOauthProvider = callOauthProvider;
    vm.credentials = {};
    var token = $location.search().token;
    if (token) {
      $http.post('/api/auth/getUserInfoFromToken', { token: token }).success(function (response) {
        vm.credentials = response;
        vm.credentials.token = token;
      }).error(function (response) {
        vm.credentials.token = token;
        vm.error = response.message;
      });
    }

    // Get an eventual error defined in the URL query string:
    vm.error = $location.search().err;

    // If user is signed in then redirect back home
    if (vm.authentication.user) {
      $location.path('/');
    }

    function signup(isValid) {
      vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      $http.post('/api/auth/signup', vm.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        vm.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'settings.invoice', $state.previous.params);
      }).error(function (response) {
        vm.error = response.message;
      });
    }

    function signin(isValid) {
      vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      $http.post('/api/auth/signin', vm.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        vm.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'root.home', $state.previous.params);
      }).error(function (response) {
        vm.error = response.message;
      });
    }

    // OAuth provider request
    function callOauthProvider(url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('PasswordController', PasswordController);

  PasswordController.$inject = ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator'];

  function PasswordController($scope, $stateParams, $http, $location, Authentication, PasswordValidator) {
    var vm = this;

    vm.resetUserPassword = resetUserPassword;
    vm.askForPasswordReset = askForPasswordReset;
    vm.authentication = Authentication;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;

    // If user is signed in then redirect back home
    if (vm.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    function askForPasswordReset(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.forgotPasswordForm');

        return false;
      }

      $http.post('/api/auth/forgot', vm.credentials).success(function (response) {
        // Show user success message and clear form
        vm.credentials = null;
        vm.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        vm.credentials = null;
        vm.error = response.message;
      });
    }

    // Change user password
    function resetUserPassword(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.resetPasswordForm');

        return false;
      }

      $http.post('/api/auth/reset/' + $stateParams.token, vm.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        vm.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        vm.error = response.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangePasswordController', ChangePasswordController);

  ChangePasswordController.$inject = ['$scope', '$http', 'Authentication', 'PasswordValidator', 'newPassword'];

  function ChangePasswordController($scope, $http, Authentication, PasswordValidator, newPassword) {
    var vm = this;

    vm.user = Authentication.user;
    vm.changeUserPassword = changeUserPassword;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;
    vm.passwordDetails = {};
    vm.passwordDetails.newPassword = newPassword;
    // Change user password
    function changeUserPassword(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.passwordForm');

        return false;
      }

      $http.post('/api/users/password', vm.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'vm.passwordForm');
        vm.success = true;
        vm.passwordDetails = null;
        $scope.$close();
      }).error(function (response) {
        vm.error = response.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangeProfilePictureController', ChangeProfilePictureController);

  ChangeProfilePictureController.$inject = ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader'];

  function ChangeProfilePictureController($scope, $timeout, $window, Authentication, FileUploader) {
    var vm = this;

    vm.user = Authentication.user;
    vm.imageURL = vm.user.profileImageURL;
    vm.uploadProfilePicture = uploadProfilePicture;

    vm.cancelUpload = cancelUpload;
    // Create file uploader instance
    vm.uploader = new FileUploader({
      url: 'api/users/picture',
      alias: 'newProfilePicture',
      onAfterAddingFile: onAfterAddingFile,
      onSuccessItem: onSuccessItem,
      onErrorItem: onErrorItem
    });

    // Set file uploader image filter
    vm.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    function onAfterAddingFile(fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            vm.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    }

    // Called after the user has successfully uploaded a new picture
    function onSuccessItem(fileItem, response, status, headers) {
      // Show success message
      vm.success = true;

      // Populate user object
      vm.user = Authentication.user = response;

      // Clear upload buttons
      cancelUpload();
    }

    // Called after the user has failed to uploaded a new picture
    function onErrorItem(fileItem, response, status, headers) {
      // Clear upload buttons
      cancelUpload();

      // Show error message
      vm.error = response.message;
    }

    // Change user profile picture
    function uploadProfilePicture() {
      // Clear messages
      vm.success = vm.error = null;

      // Start upload
      vm.uploader.uploadAll();
    }

    // Cancel the upload process
    function cancelUpload() {
      vm.uploader.clearQueue();
      vm.imageURL = vm.user.profileImageURL;
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('ConversationSettingsController', ConversationSettingsController);

  ConversationSettingsController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function ConversationSettingsController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;

    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('EditProfileController', EditProfileController);

  EditProfileController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication', '$uibModal'];

  function EditProfileController($scope, $state, $http, $location, Users, Authentication, $uibModal) {
    var vm = this;

    vm.user = Authentication.user;
    vm.copyUser = angular.copy(vm.user);
    vm.updateUserProfile = updateUserProfile;
    vm.changePassword = changePassword;
    vm.editStatus = "";
    vm.editField = editField;
    vm.exitEditField = exitEditField;

    // Update a user profile
    function updateUserProfile(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
        vm.copyUser = angular.copy(vm.user);
        vm.editStatus = "";
      }, function (response) {
        vm.error = response.data.message;
      });
    }

    function changePassword() {
      if (!vm.userForm.$valid)
        return false;
      if (vm.passwordDetails && vm.passwordDetails.password !== '') {
        $uibModal.open({
          templateUrl: 'modules/users/client/views/settings/confirm-original-password.client.view.html',
          controller: 'ChangePasswordController',
          controllerAs: 'vm',
          resolve: {
            newPassword: function () {
              return vm.passwordDetails.password;
            }
          }
        });
      } else {
        vm.passwordError = true;
      }
    }

    function editField(editStatus) {
      if (vm.userForm.$valid) {
        vm.editStatus = editStatus;
      }
    }

    function exitEditField(editStatus) {
      vm.editStatus = '';
      vm.user[editStatus] = vm.copyUser[editStatus];
    }
  }
}());

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
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('ManageIntegrationsController', ManageIntegrationsController);

  ManageIntegrationsController.$inject = ['$scope', '$http', 'Authentication', 'Users'];

  function ManageIntegrationsController($scope, $http, Authentication, Users) {
    var vm = this;

    vm.user = Authentication.user;
    vm.hasConnectedAdditionalSocialAccounts = hasConnectedAdditionalSocialAccounts;
    vm.isConnectedSocialAccount = isConnectedSocialAccount;
    vm.removeUserSocialAccount = removeUserSocialAccount;
    vm.update = update;

    // Check if there are additional accounts
    function hasConnectedAdditionalSocialAccounts() {
      return (this.user.additionalProvidersData && Object.keys($scope.user.additionalProvidersData).length);
    }

    // Check if provider is already in use with current user
    function isConnectedSocialAccount(provider) {
      return vm.user.provider === provider || (vm.user.additionalProvidersData && vm.user.additionalProvidersData[provider]);
    }

    // Remove a user social account
    function removeUserSocialAccount(provider) {
      vm.success = vm.error = null;

      $http.delete('/api/users/accounts', {
        params: {
          provider: provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        vm.success = true;
        vm.user = Authentication.user = response;
      }).error(function (response) {
        vm.error = response.message;
      });
    }

    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('PlansController', PlansController);

  PlansController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function PlansController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;

    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('PlansController', PlansController);

  PlansController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function PlansController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;

    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', 'Authentication'];

  function SettingsController($scope, $state, Authentication) {
    var vm = this;

    vm.state = $state;
    vm.user = Authentication.user;
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .directive('passwordValidator', passwordValidator);

  passwordValidator.$inject = ['PasswordValidator'];

  function passwordValidator(PasswordValidator) {
    var directive = {
      require: 'ngModel',
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      ngModel.$validators.requirements = function (password) {
        var status = true;
        if (password) {
          var result = PasswordValidator.getResult(password);
          var requirementsIdx = 0;

          // Requirements Meter - visual indicator for users
          var requirementsMeter = [{
            color: 'danger',
            progress: '20'
          }, {
            color: 'warning',
            progress: '40'
          }, {
            color: 'info',
            progress: '60'
          }, {
            color: 'primary',
            progress: '80'
          }, {
            color: 'success',
            progress: '100'
          }];

          if (result.errors.length < requirementsMeter.length) {
            requirementsIdx = requirementsMeter.length - result.errors.length - 1;
          }

          scope.requirementsColor = requirementsMeter[requirementsIdx].color;
          scope.requirementsProgress = requirementsMeter[requirementsIdx].progress;

          if (result.errors.length) {
            scope.getPopoverMsg = PasswordValidator.getPopoverMsg();
            scope.passwordErrors = result.errors;
            status = false;
          } else {
            scope.getPopoverMsg = '';
            scope.passwordErrors = [];
            status = true;
          }
        }
        return status;
      };
    }
  }
}());

(function () {
  'use strict';

  angular
    .module('users')
    .directive('passwordVerify', passwordVerify);

  function passwordVerify() {
    var directive = {
      require: 'ngModel',
      scope: {
        passwordVerify: '='
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, ngModel) {
      var status = true;
      scope.$watch(function () {
        var combined;
        if (scope.passwordVerify || ngModel) {
          combined = scope.passwordVerify + '_' + ngModel;
        }
        return combined;
      }, function (value) {
        if (value) {
          ngModel.$validators.passwordVerify = function (password) {
            var origin = scope.passwordVerify;
            return (origin === password);
          };
        }
      });
    }
  }
}());

(function () {
  'use strict';

  // Users directive used to force lowercase input
  angular
    .module('users')
    .directive('lowercase', lowercase);

  function lowercase() {
    var directive = {
      require: 'ngModel',
      link: link
    };

    return directive;

    function link(scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  }

  angular
  .module('users')
  .directive('focusMe', ["$timeout", "$parse", function($timeout, $parse) {
    return {
      link: function(scope, element, attrs) {
        var model = $parse(attrs.focusMe);
        scope.$watch(model, function(value) {
          if (value === true) {
            $timeout(function() {
              element[0].focus();
              element[0].selectionStart = 0;
              element[0].selectionEnd = 0;
            });
          }
        });
      }
    };
  }]);
}());

(function () {
  'use strict';

  // Authentication service for user variables

  angular
    .module('users.services')
    .factory('Authentication', Authentication);

  Authentication.$inject = ['$window'];

  function Authentication($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
}());

(function () {
  'use strict';

  // PasswordValidator service used for testing the password strength
  angular
    .module('users.services')
    .factory('PasswordValidator', PasswordValidator);

  PasswordValidator.$inject = ['$window'];

  function PasswordValidator($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    var service = {
      getResult: getResult,
      getPopoverMsg: getPopoverMsg
    };

    return service;

    function getResult(password) {
      var result = owaspPasswordStrengthTest.test(password);
      return result;
    }

    function getPopoverMsg() {
      var popoverMsg = 'Please enter a passphrase or password with 10 or more characters, numbers, lowercase, uppercase, and special characters.';

      return popoverMsg;
    }
  }

}());

(function () {
  'use strict';

  // Users service used for communicating with the users REST endpoint
  angular
    .module('users.services')
    .factory('Users', Users);

  Users.$inject = ['$resource'];

  function Users($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }

  // TODO this should be Users service
  angular
    .module('users.admin.services')
    .factory('AdminService', AdminService);

  AdminService.$inject = ['$resource'];

  function AdminService($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
