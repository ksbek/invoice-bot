'use strict';

describe('Clients E2E Tests:', function () {
  describe('Test Clients page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/clients');
      expect(element.all(by.repeater('client in clients')).count()).toEqual(0);
    });
  });
});
