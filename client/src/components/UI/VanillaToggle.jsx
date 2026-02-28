// Toggle de modo discreto (Fase 6.3)
// Ícono de ojo abierto/cerrado en el mapa
const VanillaToggle = ({ isActive, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isActive
          ? 'bg-yellow-600/80 border-2 border-yellow-400'
          : 'bg-dark-200/90 border border-dark-100'
      } backdrop-blur-sm shadow-lg hover:scale-105`}
      title={isActive ? 'Modo discreto activo' : 'Activar modo discreto'}
    >
      {isActive ? (
        // Ojo cerrado
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        // Ojo abierto
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
};

export default VanillaToggle;
