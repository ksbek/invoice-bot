'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Client = mongoose.model('Client'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  client;

/**
 * Client routes tests
 */
describe('Client CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Client
    user.save(function () {
      client = {
        name: 'Client name'
      };

      done();
    });
  });

  it('should be able to save a Client if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Client
        agent.post('/api/clients')
          .send(client)
          .expect(200)
          .end(function (clientSaveErr, clientSaveRes) {
            // Handle Client save error
            if (clientSaveErr) {
              return done(clientSaveErr);
            }

            // Get a list of Clients
            agent.get('/api/clients')
              .end(function (clientsGetErr, clientsGetRes) {
                // Handle Client save error
                if (clientsGetErr) {
                  return done(clientsGetErr);
                }

                // Get Clients list
                var clients = clientsGetRes.body;

                // Set assertions
                (clients[0].user._id).should.equal(userId);
                (clients[0].name).should.match('Client name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Client if not logged in', function (done) {
    agent.post('/api/clients')
      .send(client)
      .expect(403)
      .end(function (clientSaveErr, clientSaveRes) {
        // Call the assertion callback
        done(clientSaveErr);
      });
  });

  it('should not be able to save an Client if no name is provided', function (done) {
    // Invalidate name field
    client.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Client
        agent.post('/api/clients')
          .send(client)
          .expect(400)
          .end(function (clientSaveErr, clientSaveRes) {
            // Set message assertion
            (clientSaveRes.body.message).should.match('Please fill Client name');

            // Handle Client save error
            done(clientSaveErr);
          });
      });
  });

  it('should be able to update an Client if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Client
        agent.post('/api/clients')
          .send(client)
          .expect(200)
          .end(function (clientSaveErr, clientSaveRes) {
            // Handle Client save error
            if (clientSaveErr) {
              return done(clientSaveErr);
            }

            // Update Client name
            client.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Client
            agent.put('/api/clients/' + clientSaveRes.body._id)
              .send(client)
              .expect(200)
              .end(function (clientUpdateErr, clientUpdateRes) {
                // Handle Client update error
                if (clientUpdateErr) {
                  return done(clientUpdateErr);
                }

                // Set assertions
                (clientUpdateRes.body._id).should.equal(clientSaveRes.body._id);
                (clientUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Clients if not signed in', function (done) {
    // Create new Client model instance
    var clientObj = new Client(client);

    // Save the client
    clientObj.save(function () {
      // Request Clients
      request(app).get('/api/clients')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Client if not signed in', function (done) {
    // Create new Client model instance
    var clientObj = new Client(client);

    // Save the Client
    clientObj.save(function () {
      request(app).get('/api/clients/' + clientObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', client.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Client with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/clients/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Client is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Client which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Client
    request(app).get('/api/clients/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Client with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Client if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Client
        agent.post('/api/clients')
          .send(client)
          .expect(200)
          .end(function (clientSaveErr, clientSaveRes) {
            // Handle Client save error
            if (clientSaveErr) {
              return done(clientSaveErr);
            }

            // Delete an existing Client
            agent.delete('/api/clients/' + clientSaveRes.body._id)
              .send(client)
              .expect(200)
              .end(function (clientDeleteErr, clientDeleteRes) {
                // Handle client error error
                if (clientDeleteErr) {
                  return done(clientDeleteErr);
                }

                // Set assertions
                (clientDeleteRes.body._id).should.equal(clientSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Client if not signed in', function (done) {
    // Set Client user
    client.user = user;

    // Create new Client model instance
    var clientObj = new Client(client);

    // Save the Client
    clientObj.save(function () {
      // Try deleting Client
      request(app).delete('/api/clients/' + clientObj._id)
        .expect(403)
        .end(function (clientDeleteErr, clientDeleteRes) {
          // Set message assertion
          (clientDeleteRes.body.message).should.match('User is not authorized');

          // Handle Client error error
          done(clientDeleteErr);
        });

    });
  });

  it('should be able to get a single Client that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Client
          agent.post('/api/clients')
            .send(client)
            .expect(200)
            .end(function (clientSaveErr, clientSaveRes) {
              // Handle Client save error
              if (clientSaveErr) {
                return done(clientSaveErr);
              }

              // Set assertions on new Client
              (clientSaveRes.body.name).should.equal(client.name);
              should.exist(clientSaveRes.body.user);
              should.equal(clientSaveRes.body.user._id, orphanId);

              // force the Client to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Client
                    agent.get('/api/clients/' + clientSaveRes.body._id)
                      .expect(200)
                      .end(function (clientInfoErr, clientInfoRes) {
                        // Handle Client error
                        if (clientInfoErr) {
                          return done(clientInfoErr);
                        }

                        // Set assertions
                        (clientInfoRes.body._id).should.equal(clientSaveRes.body._id);
                        (clientInfoRes.body.name).should.equal(client.name);
                        should.equal(clientInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Client.remove().exec(done);
    });
  });
});
