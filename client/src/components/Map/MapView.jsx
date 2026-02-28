// Componente principal del mapa interactivo
// Integra: pins por tipo, filtros, modo discreto, preview, broadcasts
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import useGeolocation from '../../hooks/useGeolocation';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import MapControls from './MapControls';
import FilterBar from './FilterBar';
import PinPreview from './PinPreview';
import VanillaToggle from '../UI/VanillaToggle';
import { getPinColor, isCouple } from '../../utils/pinColors';

// Token público de Mapbox (VITE_ prefix — seguro para el cliente)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Ubicación por defecto si el usuario no da permiso (San Juan, PR)
const DEFAULT_CENTER = [-66.1057, 18.4655];
const DEFAULT_ZOOM = 14;

// Tiempo máximo sin actualización antes de considerar un usuario como inactivo (ms)
const STALE_THRESHOLD = 60000;

const MapView = ({ onPinClick, chatUnreadMap, vanillaMode, onToggleVanilla, onShowBroadcasts, broadcastCount }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // { userId: marker }
  const userMarkerRef = useRef(null);
  const staleCheckRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark-v11');
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [visibleTypes, setVisibleTypes] = useState(new Set());
  const [previewUser, setPreviewUser] = useState(null);

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

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar posición del usuario actual en el mapa
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !location) return;
    const { latitude, longitude } = location;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-pin-current';
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: DEFAULT_ZOOM, duration: 1500 });
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }
  }, [location, mapLoaded]);

  // Enviar ubicación por socket y recibir usuarios cercanos
  useEffect(() => {
    if (!socket || !isConnected || !location || !user?.id) return;

    socket.emit('location:update', {
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude
    });

    const onNearbyUsers = (data) => setNearbyUsers(data.users || []);
    socket.on('users:nearby', onNearbyUsers);
    return () => socket.off('users:nearby', onNearbyUsers);
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
      const { id, location: userLoc, displayName, isProfileComplete, userType } = nearbyUser;
      if (!userLoc?.longitude || !userLoc?.latitude) return;

      // Filtrar por tipo de usuario (Fase 5.3)
      const isVisible = visibleTypes.size === 0 || visibleTypes.has(userType) || !userType;

      if (markersRef.current[id]) {
        markersRef.current[id].setLngLat([userLoc.longitude, userLoc.latitude]);
        markersRef.current[id].getElement().style.display = isVisible ? '' : 'none';
      } else {
        const el = document.createElement('div');
        const pinColor = getPinColor(userType);
        const couple = isCouple(userType);

        el.className = 'user-pin-other';
        el.style.backgroundColor = pinColor;
        el.style.display = isVisible ? '' : 'none';

        if (couple) {
          el.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${pinColor}`;
          el.style.border = 'none';
        }

        if (isProfileComplete && displayName && !vanillaMode) {
          el.textContent = displayName[0].toUpperCase();
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.fontSize = '11px';
        }

        if (vanillaMode) el.style.filter = 'blur(3px)';

        const unread = chatUnreadMap?.[id];
        if (unread && unread > 0) {
          const badge = document.createElement('span');
          badge.className = 'pin-badge';
          badge.textContent = unread > 9 ? '9+' : unread;
          el.style.position = 'relative';
          el.appendChild(badge);
        }

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([userLoc.longitude, userLoc.latitude])
          .addTo(mapRef.current);

        el.addEventListener('click', () => setPreviewUser(nearbyUser));
        markersRef.current[id] = marker;
      }
    });
  }, [nearbyUsers, mapLoaded, chatUnreadMap, visibleTypes, vanillaMode]);

  // Detección de usuarios inactivos — cada 15 segundos
  useEffect(() => {
    staleCheckRef.current = setInterval(() => {
      const now = Date.now();
      setNearbyUsers(prev => prev.filter(u => (now - new Date(u.lastSeen).getTime()) < STALE_THRESHOLD));
    }, 15000);
    return () => { if (staleCheckRef.current) clearInterval(staleCheckRef.current); };
  }, []);

  const centerOnUser = useCallback(() => {
    if (!mapRef.current || !location) return;
    mapRef.current.flyTo({ center: [location.longitude, location.latitude], zoom: DEFAULT_ZOOM, duration: 1000 });
  }, [location]);

  const toggleMapStyle = useCallback(() => {
    const styles = ['dark-v11', 'streets-v12', 'satellite-streets-v12'];
    const currentIdx = styles.indexOf(mapStyle);
    const nextStyle = styles[(currentIdx + 1) % styles.length];
    setMapStyle(nextStyle);
    if (mapRef.current) mapRef.current.setStyle(`mapbox://styles/mapbox/${nextStyle}`);
  }, [mapStyle]);

  const handleFilterChange = useCallback((types) => setVisibleTypes(types), []);

  const handleViewProfile = useCallback((nearbyUser) => {
    setPreviewUser(null);
    if (onPinClick) onPinClick(nearbyUser);
  }, [onPinClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Filtros de mapa (Fase 5.3) */}
      <FilterBar seekingTypes={user?.seekingTypes} onFilterChange={handleFilterChange} />

      {/* Controles superiores derecha */}
      <div className="absolute top-16 right-4 flex flex-col gap-2 z-20">
        <VanillaToggle isActive={vanillaMode} onToggle={onToggleVanilla} />
      </div>

      {/* Broadcasts (Fase 6.4) */}
      <div className="absolute top-16 left-4 z-20">
        <button
          onClick={onShowBroadcasts}
          className="relative w-10 h-10 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                     border border-dark-100 shadow-lg hover:bg-dark-100 transition-colors"
          title="Updates del área"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {broadcastCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {broadcastCount}
            </span>
          )}
        </button>
      </div>

      <MapControls
        onCenter={centerOnUser}
        onToggleStyle={toggleMapStyle}
        hasLocation={!!location}
        nearbyCount={nearbyUsers.filter(u => visibleTypes.size === 0 || visibleTypes.has(u.userType) || !u.userType).length}
        isConnected={isConnected}
      />

      {/* Preview del pin (Fase 5.2) */}
      <PinPreview
        user={previewUser}
        currentUser={user}
        onViewProfile={handleViewProfile}
        onClose={() => setPreviewUser(null)}
        vanillaMode={vanillaMode}
      />

      {/* Estado de geolocalización */}
      {status === 'loading' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-dark-200 px-4 py-2 rounded-full text-sm animate-fade-in shadow-lg z-10">
          <span className="animate-pulse">Obteniendo tu ubicación...</span>
        </div>
      )}
      {status === 'permission-denied' && (
        <div className="absolute top-12 left-4 right-4 bg-yellow-900/90 border border-yellow-600 px-4 py-3 rounded-xl text-sm animate-fade-in z-10">
          <p className="font-medium text-yellow-200">Ubicación no disponible</p>
          <p className="text-yellow-300 mt-1">{geoError || 'Activa la ubicación en tu navegador para ver usuarios cercanos.'}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute top-12 left-4 right-4 bg-red-900/90 border border-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in z-10">
          <p className="font-medium text-red-200">Error de ubicación</p>
          <p className="text-red-300 mt-1">{geoError}</p>
        </div>
      )}
      {!isConnected && user && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-900/90 px-4 py-2 rounded-full text-sm animate-fade-in">
          Reconectando...
        </div>
      )}
    </div>
  );
};

export default MapView;
