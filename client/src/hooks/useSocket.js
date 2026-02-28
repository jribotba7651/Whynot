// Hook personalizado para Socket.io
// Re-exporta el contexto de socket para uso más cómodo
import { useSocket as useSocketContext } from '../context/SocketContext';

const useSocket = () => {
  return useSocketContext();
};

export default useSocket;
