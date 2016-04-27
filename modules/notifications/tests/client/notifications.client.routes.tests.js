(function () {
  'use strict';

  describe('notifications Route Tests', function () {
    // Initialize global variables
    var $scope,
      Authentication;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _Authentication_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      Authentication = _Authentication_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('notifications');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/notifications');
        });

        it('Should not be abstract', function () {
          expect(mainstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(mainstate.templateUrl).toBe('modules/notifications/client/views/notifications.client.view.html');
        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope, _Authentication_) {
          Authentication.user = {
            name: 'user',
            roles: ['user']
          };

          $state.go('notifications');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('notifications/');
          $rootScope.$digest();

          expect($location.path()).toBe('/notifications');
          expect($state.current.templateUrl).toBe('modules/notifications/client/views/notifications.client.view.html');
        }));
      });

    });
  });
}());
