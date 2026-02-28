// Componente principal del mapa interactivo
// Inicializa Mapbox GL JS, muestra pins de usuarios y actualiza en tiempo real
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import useGeolocation from '../../hooks/useGeolocation';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import MapControls from './MapControls';

// Token público de Mapbox (VITE_ prefix — seguro para el cliente)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Ubicación por defecto si el usuario no da permiso (San Juan, PR)
const DEFAULT_CENTER = [-66.1057, 18.4655];
const DEFAULT_ZOOM = 14;

// Tiempo máximo sin actualización antes de considerar un usuario como inactivo (ms)
const STALE_THRESHOLD = 60000;

const MapView = ({ onPinClick, chatUnreadMap }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // { userId: marker }
  const userMarkerRef = useRef(null);
  const staleCheckRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark-v11');
  const [nearbyUsers, setNearbyUsers] = useState([]);

  const { location, status, error: geoError } = useGeolocation();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Inicializar mapa de Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false
    });

    // Control de atribución compacto
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    // Cleanup al desmontar
    return () => {
      // Limpiar todos los markers
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (staleCheckRef.current) {
        clearInterval(staleCheckRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar posición del usuario actual en el mapa
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !location) return;

    const { latitude, longitude } = location;

    if (!userMarkerRef.current) {
      // Crear marker del usuario actual (pin pulsante azul)
      const el = document.createElement('div');
      el.className = 'user-pin-current';

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);

      // Centrar mapa en la primera ubicación
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: DEFAULT_ZOOM,
        duration: 1500
      });
    } else {
      // Actualizar posición existente
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }
  }, [location, mapLoaded]);

  // Enviar ubicación por socket y recibir usuarios cercanos
  useEffect(() => {
    if (!socket || !isConnected || !location || !user?.id) return;

    // Enviar ubicación al servidor
    socket.emit('location:update', {
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude
    });

    // Escuchar usuarios cercanos
    const onNearbyUsers = (data) => {
      setNearbyUsers(data.users || []);
    };

    socket.on('users:nearby', onNearbyUsers);

    return () => {
      socket.off('users:nearby', onNearbyUsers);
    };
  }, [socket, isConnected, location, user?.id]);

  // Actualizar markers de otros usuarios en el mapa
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const currentMarkerIds = new Set(Object.keys(markersRef.current));
    const newUserIds = new Set(nearbyUsers.map(u => u.id));

    // Eliminar markers de usuarios que ya no están cerca
    for (const id of currentMarkerIds) {
      if (!newUserIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    }

    // Agregar o actualizar markers
    nearbyUsers.forEach((nearbyUser) => {
      const { id, location: userLoc, displayName, profile, isProfileComplete } = nearbyUser;

      if (!userLoc?.longitude || !userLoc?.latitude) return;

      if (markersRef.current[id]) {
        // Actualizar posición existente
        markersRef.current[id].setLngLat([userLoc.longitude, userLoc.latitude]);
      } else {
        // Crear nuevo marker
        const el = document.createElement('div');
        const lookingFor = profile?.lookingFor || 'lo-que-sea';
        el.className = `user-pin-other pin-${lookingFor.replace(/\s/g, '-')}`;

        // Mostrar primera letra del nombre si tiene perfil
        if (isProfileComplete && displayName) {
          el.textContent = displayName[0].toUpperCase();
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.fontSize = '11px';
        }

        // Badge de no leídos si hay mensajes
        const unread = chatUnreadMap?.[id];
        if (unread && unread > 0) {
          const badge = document.createElement('span');
          badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center';
          badge.textContent = unread > 9 ? '9+' : unread;
          el.style.position = 'relative';
          el.appendChild(badge);
        }

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([userLoc.longitude, userLoc.latitude])
          .addTo(mapRef.current);

        // Click en el pin → abrir perfil/chat
        el.addEventListener('click', () => {
          if (onPinClick) {
            onPinClick(nearbyUser);
          }
        });

        markersRef.current[id] = marker;
      }
    });
  }, [nearbyUsers, mapLoaded, chatUnreadMap, onPinClick]);

  // Detección de usuarios inactivos (stale) — cada 15 segundos
  useEffect(() => {
    staleCheckRef.current = setInterval(() => {
      const now = Date.now();
      setNearbyUsers(prev =>
        prev.filter(u => {
          const lastSeen = new Date(u.lastSeen).getTime();
          return (now - lastSeen) < STALE_THRESHOLD;
        })
      );
    }, 15000);

    return () => {
      if (staleCheckRef.current) {
        clearInterval(staleCheckRef.current);
      }
    };
  }, []);

  // Centrar mapa en la ubicación del usuario
  const centerOnUser = useCallback(() => {
    if (!mapRef.current || !location) return;
    mapRef.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: DEFAULT_ZOOM,
      duration: 1000
    });
  }, [location]);

  // Cambiar estilo del mapa
  const toggleMapStyle = useCallback(() => {
    const styles = ['dark-v11', 'streets-v12', 'satellite-streets-v12'];
    const currentIdx = styles.indexOf(mapStyle);
    const nextStyle = styles[(currentIdx + 1) % styles.length];
    setMapStyle(nextStyle);
    if (mapRef.current) {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${nextStyle}`);
    }
  }, [mapStyle]);

  return (
    <div className="relative w-full h-full">
      {/* Contenedor del mapa */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controles del mapa */}
      <MapControls
        onCenter={centerOnUser}
        onToggleStyle={toggleMapStyle}
        hasLocation={!!location}
        nearbyCount={nearbyUsers.length}
        isConnected={isConnected}
      />

      {/* Estado de geolocalización */}
      {status === 'loading' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-dark-200 px-4 py-2 rounded-full text-sm animate-fade-in shadow-lg">
          <span className="animate-pulse">Obteniendo tu ubicación...</span>
        </div>
      )}

      {status === 'permission-denied' && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-900/90 border border-yellow-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <p className="font-medium text-yellow-200">Ubicación no disponible</p>
          <p className="text-yellow-300 mt-1">
            {geoError || 'Activa la ubicación en tu navegador para ver usuarios cercanos.'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <p className="font-medium text-red-200">Error de ubicación</p>
          <p className="text-red-300 mt-1">{geoError}</p>
        </div>
      )}

      {/* Indicador de conexión */}
      {!isConnected && user && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-900/90 px-4 py-2 rounded-full text-sm animate-fade-in">
          Reconectando...
        </div>
      )}
    </div>
  );
};

export default MapView;
