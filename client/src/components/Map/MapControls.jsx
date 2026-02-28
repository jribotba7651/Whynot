// Controles del mapa
// Botones flotantes: centrar ubicación, cambiar estilo, info de usuarios cercanos
const MapControls = ({ onCenter, onToggleStyle, hasLocation, nearbyCount, isConnected }) => {
  return (
    <div className="absolute right-3 top-16 flex flex-col gap-2 z-10">
      {/* Botón: Centrar en mi ubicación */}
      <button
        onClick={onCenter}
        disabled={!hasLocation}
        className="w-10 h-10 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                   border border-dark-100 shadow-lg hover:bg-dark-100 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
        title="Centrar en mi ubicación"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {/* Botón: Cambiar estilo del mapa */}
      <button
        onClick={onToggleStyle}
        className="w-10 h-10 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                   border border-dark-100 shadow-lg hover:bg-dark-100 transition-colors"
        title="Cambiar estilo del mapa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      {/* Indicador de usuarios cercanos */}
      <div
        className="w-10 h-10 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                    border border-dark-100 shadow-lg text-xs font-bold"
        title={`${nearbyCount} usuario(s) cerca`}
      >
        <span className={nearbyCount > 0 ? 'text-primary-400' : 'text-gray-500'}>
          {nearbyCount}
        </span>
      </div>

      {/* Indicador de conexión */}
      <div
        className={`w-3 h-3 rounded-full mx-auto ${
          isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
        title={isConnected ? 'Conectado' : 'Desconectado'}
      />
    </div>
  );
};

export default MapControls;
