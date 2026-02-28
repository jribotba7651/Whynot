// Contexto de Socket.io
// Provee la conexión WebSocket a toda la app
// Maneja la inicialización y limpieza del socket
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Inicializar socket
    const socket = initSocket();
    socketRef.current = socket;

    // Listeners de estado de conexión
    const onConnect = () => {
      setIsConnected(true);
      // Registrar usuario en el servidor
      socket.emit('user:connect', { userId: user.id });
      socket.emit('chat:register', { userId: user.id });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Si ya está conectado, registrar inmediatamente
    if (socket.connected) {
      onConnect();
    }

    // Cleanup al desmontar
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [user?.id]);

  // Limpiar al desmontar el provider
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current || getSocket(),
      isConnected
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de un SocketProvider');
  }
  return context;
};

export default SocketContext;
