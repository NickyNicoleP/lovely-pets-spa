const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let io;
const userSockets = new Map();

const initIo = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Token de acceso requerido'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Token inválido o expirado'));
      }
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    console.log('Socket.io conectado:', socket.id, 'user:', userId);

    if (userId) {
      const sockets = userSockets.get(userId) || new Set();
      sockets.add(socket.id);
      userSockets.set(userId, sockets);
      socket.join(`user_${userId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
      console.log('Socket.io desconectado:', socket.id);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io no inicializado');
  }
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
};

module.exports = {
  initIo,
  getIo,
  emitToUser
};
