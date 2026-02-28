// Hook personalizado de geolocalización
// Maneja permisos, tracking continuo y throttling de actualizaciones
// Estados: loading, success, error, permission-denied
import { useState, useEffect, useRef, useCallback } from 'react';

// Intervalo mínimo entre actualizaciones emitidas (ms)
const UPDATE_INTERVAL = parseInt(import.meta.env.VITE_LOCATION_UPDATE_INTERVAL_MS) || 10000;

const useGeolocation = () => {
  // Estado de la ubicación
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | success | error | permission-denied
  const [error, setError] = useState(null);

  // Refs para cleanup y throttling
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const callbackRef = useRef(null);

  // Registrar callback para cuando la ubicación cambia (throttled)
  const onLocationChange = useCallback((callback) => {
    callbackRef.current = callback;
  }, []);

  // Iniciar tracking de ubicación
  useEffect(() => {
    // Verificar soporte de geolocalización
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    // Opciones de geolocalización
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,        // 15 segundos de timeout
      maximumAge: 5000       // Aceptar posición de hasta 5 segundos atrás
    };

    // Callback de éxito
    const onSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      const newLocation = { latitude, longitude, accuracy };
      setLocation(newLocation);
      setStatus('success');
      setError(null);

      // Throttle: solo emitir si han pasado suficientes milisegundos
      const now = Date.now();
      if (now - lastEmitRef.current >= UPDATE_INTERVAL) {
        lastEmitRef.current = now;
        if (callbackRef.current) {
          callbackRef.current(newLocation);
        }
      }
    };

    // Callback de error
    const onError = (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setStatus('permission-denied');
          setError('Permiso de ubicación denegado. Activa la ubicación en la configuración de tu navegador.');
          break;
        case err.POSITION_UNAVAILABLE:
          setStatus('error');
          setError('No se pudo determinar tu ubicación. Verifica que el GPS esté activado.');
          break;
        case err.TIMEOUT:
          setStatus('error');
          setError('La solicitud de ubicación tardó demasiado. Intenta de nuevo.');
          break;
        default:
          setStatus('error');
          setError('Error desconocido obteniendo la ubicación.');
      }
    };

    // Usar watchPosition para tracking continuo (más eficiente que getCurrentPosition repetido)
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    );

    // Cleanup — detener tracking al desmontar
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Forzar una emisión inmediata de la ubicación actual
  const forceEmit = useCallback(() => {
    if (location && callbackRef.current) {
      lastEmitRef.current = Date.now();
      callbackRef.current(location);
    }
  }, [location]);

  return {
    location,       // { latitude, longitude, accuracy } o null
    status,         // 'loading' | 'success' | 'error' | 'permission-denied'
    error,          // Mensaje de error en español o null
    onLocationChange, // Registrar callback para actualizaciones throttled
    forceEmit       // Forzar emisión inmediata
  };
};

export default useGeolocation;
