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
          pageTitle: 'Settings pricing'
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
      .state('settings.team', {
        url: '/team',
        templateUrl: 'modules/users/client/views/settings/team.client.view.html',
        controller: 'TeamController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Users'
        },
        resolve: {
          getUsers: getUsers
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
      .state('authentication.pending', {
        url: '/pending',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/authentication/pending.client.view.html',
            controller: 'AuthenticationController',
            controllerAs: 'vm'
          }
        },
        data: {
          pageTitle: 'Pending'
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
          pageTitle: 'Sign In and get your invoices paid',
          pageDescription: 'Sign into Nowdue. Access your account by entering your email and password. If you have not yet signed up to Nowdue please visit the home page and select the Add to Slack button.'
        }
      })
      .state('password', {
        abstract: true,
        url: '/password',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          }
        }
      })
      .state('password.forgot', {
        url: '/forgot',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html',
            controller: 'PasswordController',
            controllerAs: 'vm',
            data: {
              pageTitle: 'Password forgot'
            }
          }
        }
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html',
            data: {
              pageTitle: 'Password reset invalid'
            }
          }
        }
      })
      .state('password.reset.success', {
        url: '/success',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html',
            data: {
              pageTitle: 'Password reset success'
            }
          }
        }
      })
      .state('password.reset.form', {
        url: '/:token',
        views: {
          'container@': {
            templateUrl: 'modules/users/client/views/password/reset-password.client.view.html',
            controller: 'PasswordController',
            controllerAs: 'vm',
            data: {
              pageTitle: 'Password reset form'
            }
          }
        }
      });

    getUsers.$inject = ['$http'];

    function getUsers($http) {
      return $http.post('/api/users/teammembers');
    }
  }
}());
