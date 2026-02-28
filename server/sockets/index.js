// Configuración principal de Socket.io
// Registra todos los handlers de eventos (ubicación, chat)
const { locationHandler } = require('./locationHandler');
const { chatHandler } = require('./chatHandler');

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

    // Registrar handlers de ubicación y chat
    locationHandler(io, socket);
    chatHandler(io, socket);
  });

  console.log('[Socket] Socket.io inicializado');
};

module.exports = initializeSockets;
