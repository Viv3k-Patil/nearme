const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const userStore = require('./utils/userStore');
const { generateUsername } = require('./utils/usernameGenerator');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all origins for deployment
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
// Serve React frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
const PORT = process.env.PORT || 3000;

// Socket.IO connection handling
io.on('connection', (socket) => {
  const username = generateUsername();
  console.log('New user connected:', socket.id, 'as', username);

  // Assign username to client
  socket.emit('usernameAssigned', username);

  // Send current users
  socket.emit('nearbyUsers', userStore.getAllUsers());

  // Location Updates
  socket.on('updateLocation', (data) => {
    if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
      console.log('Invalid location data from:', socket.id);
      return;
    }

    userStore.addUser(socket.id, {
      username,
      lat: data.lat,
      lng: data.lng
    });

    // Broadcast all active users
    io.emit('nearbyUsers', userStore.getAllUsers());
  });

  // 1:1 Ephemeral Chat
  socket.on('startChat', ({ toUserId }) => {
    if (!toUserId) {
      console.log('Invalid toUserId:', socket.id);
      return;
    }
    const room = [socket.id, toUserId].sort().join('_');
    socket.join(room);
    console.log(`${socket.id} started chat room ${room}`);

    // Notify the target user to open chat panel
    socket.to(toUserId).emit('chatRequest', { room, from: socket.id });
  });

  socket.on('joinRoom', ({ room }) => {
    if (room) {
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    }
  });

  socket.on('sendMessage', ({ room, message }) => {
    if (!room || !message) {
      console.log('Invalid message data from:', socket.id);
      return;
    }

    const msg = {
      from: socket.id,
      text: message,
      timestamp: Date.now(),
      room
    };

    // Emit to all clients in the room, including sender
    io.to(room).emit('receiveMessage', msg);
  });

  // Typing Indicator
  socket.on('typing', ({ room }) => {
    socket.to(room).emit('userTyping', { from: socket.id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    userStore.removeUser(socket.id);
    io.emit('nearbyUsers', userStore.getAllUsers());
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});