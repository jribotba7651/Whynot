// Hook personalizado para autenticación
// Re-exporta el contexto de auth para uso más cómodo
import { useAuth as useAuthContext } from '../context/AuthContext';

const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
