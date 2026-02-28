// Configuración principal de Socket.io
// Registra todos los handlers de eventos (ubicación, chat, broadcasts)
const { locationHandler } = require('./locationHandler');
const { chatHandler } = require('./chatHandler');
const { broadcastHandler } = require('./broadcastHandler');

const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Nueva conexión: ${socket.id}`);

    // Evento inicial — cuando el usuario confirma su identidad
    socket.on('user:connect', (data) => {
      if (data?.userId) {
        console.log(`[Socket] Usuario conectado: ${data.userId}`);
        // Registrar para chat
        socket.emit('user:connected', { socketId: socket.id });
      }
    });

    // Registrar handlers de ubicación, chat y broadcasts
    locationHandler(io, socket);
    chatHandler(io, socket);
    broadcastHandler(io, socket);
  });

  console.log('[Socket] Socket.io inicializado');
};

module.exports = initializeSockets;
