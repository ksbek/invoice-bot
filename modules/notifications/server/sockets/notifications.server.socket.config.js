'use strict';

// Create the notifications configuration
module.exports = function (io, socket) {
  // Emit the status event when a new socket client is connected
  io.emit('notificationsMessage', {
    type: 'status',
    text: 'Is now connected',
    created: Date.now(),
    profileImageURL: socket.request.user.profileImageURL,
    username: socket.request.user.username
  });

  // Send a notifications messages to all connected sockets when a message is received
  socket.on('notificationsMessage', function (message) {
    message.type = 'message';
    message.created = Date.now();
    message.profileImageURL = socket.request.user.profileImageURL;
    message.username = socket.request.user.username;

    // Emit the 'notificationsMessage' event
    io.emit('notificationsMessage', message);
  });

  // Emit the status event when a socket client is disconnected
  socket.on('disconnect', function () {
    io.emit('notificationsMessage', {
      type: 'status',
      text: 'disconnected',
      created: Date.now(),
      username: socket.request.user.username
    });
  });
};
