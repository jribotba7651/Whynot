// Contexto de autenticación
// Maneja sesiones anónimas y cuentas registradas
// Provee el estado del usuario a toda la app
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSession, getToken, setToken, registerAccount, loginAccount, logoutAccount } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar sesión al cargar la app
  useEffect(() => {
    initSession();
  }, []);

  // Crear o restaurar sesión
  const initSession = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (token) {
        // Hay token guardado — verificar si es válido
        // El token se verificará en la primera llamada API
        // Por ahora, decodificar el payload para obtener info básica
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // Verificar que no ha expirado
          if (payload.exp * 1000 > Date.now()) {
            // Token válido — recuperar datos del usuario del localStorage
            const savedUser = localStorage.getItem('whynot_user');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
              setLoading(false);
              return;
            }
          }
        } catch {
          // Token inválido — crear nueva sesión
        }
      }

      // No hay sesión válida — crear sesión anónima
      const data = await createSession();
      setToken(data.token);
      localStorage.setItem('whynot_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      console.error('[Auth] Error inicializando sesión:', err.message);
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Registrar cuenta (migra datos de sesión anónima)
  const register = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await registerAccount(email, password);
      setToken(data.token);
      localStorage.setItem('whynot_refresh_token', data.refreshToken);
      localStorage.setItem('whynot_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Iniciar sesión con cuenta existente
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await loginAccount(email, password);
      setToken(data.token);
      localStorage.setItem('whynot_refresh_token', data.refreshToken);
      localStorage.setItem('whynot_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // Ignorar errores al cerrar sesión
    }
    localStorage.removeItem('whynot_token');
    localStorage.removeItem('whynot_refresh_token');
    localStorage.removeItem('whynot_user');
    setUser(null);
    // Crear nueva sesión anónima
    await initSession();
  }, []);

  // Actualizar datos del usuario en el contexto
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('whynot_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      register,
      login,
      logout,
      updateUser,
      isAnonymous: user?.isAnonymous !== false && user?.accountType !== 'registered',
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
