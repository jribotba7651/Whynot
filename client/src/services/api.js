// Servicio de API — wrapper para llamadas HTTP al backend
// Maneja tokens JWT automáticamente en headers

const API_URL = import.meta.env.VITE_API_URL || '';

// Obtener token del localStorage
const getToken = () => localStorage.getItem('whynot_token');

// Guardar token en localStorage
const setToken = (token) => localStorage.setItem('whynot_token', token);

// Guardar refresh token
const setRefreshToken = (token) => localStorage.getItem('whynot_refresh_token', token);

// Llamada genérica a la API con manejo de JWT
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Si el token expiró, intentar refresh
  if (response.status === 401) {
    const data = await response.json();
    if (data.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Reintentar con el nuevo token
        config.headers.Authorization = `Bearer ${getToken()}`;
        return fetch(`${API_URL}${endpoint}`, config).then(r => r.json());
      }
    }
    throw new Error(data.error || 'No autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
};

// Intentar renovar el token con refresh token
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('whynot_refresh_token');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) return false;

    const data = await response.json();
    setToken(data.token);
    localStorage.setItem('whynot_refresh_token', data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// --- Métodos de la API ---

// Crear sesión anónima
export const createSession = () =>
  apiCall('/api/session', { method: 'POST' });

// Obtener usuarios cercanos (fallback REST)
export const getNearbyUsers = (lat, lon, radius) =>
  apiCall(`/api/users/nearby?lat=${lat}&lon=${lon}&radius=${radius || 5000}`);

// Obtener perfil de un usuario
export const getUserProfile = (userId) =>
  apiCall(`/api/users/${userId}/profile`);

// Actualizar mi perfil
export const updateProfile = (profileData) =>
  apiCall('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });

// Registrar cuenta
export const registerAccount = (email, password) => {
  const currentToken = getToken();
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, currentToken })
  });
};

// Iniciar sesión
export const loginAccount = (email, password) =>
  apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

// Cerrar sesión
export const logoutAccount = () =>
  apiCall('/api/auth/logout', { method: 'POST' });

// Cambiar contraseña
export const changePassword = (currentPassword, newPassword) =>
  apiCall('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });

// Eliminar cuenta
export const deleteAccount = () =>
  apiCall('/api/auth/account', { method: 'DELETE' });

// Obtener conversaciones
export const getConversations = () =>
  apiCall('/api/conversations');

// Obtener mensajes de una conversación
export const getMessages = (conversationId, before, limit = 20) => {
  let url = `/api/conversations/${conversationId}/messages?limit=${limit}`;
  if (before) url += `&before=${before}`;
  return apiCall(url);
};

export { getToken, setToken, setRefreshToken, API_URL };
