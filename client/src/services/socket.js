// Servicio de Socket.io — configuración del cliente WebSocket
// Gestiona la conexión y reconexión automática
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

// Inicializar conexión de socket
export const initSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    // Reconexión automática
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Timeout de conexión
    timeout: 10000,
    // Transporte preferido
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Error de conexión:', error.message);
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error.message);
  });

  return socket;
};

// Obtener la instancia actual del socket
export const getSocket = () => socket;

// Desconectar socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initSocket, getSocket, disconnectSocket };
