// Badge de compatibilidad entre usuarios (Fase 5.4)
// Muestra si hay match mutuo, interés unidireccional, o nada
import { getCompatibility } from '../../utils/compatibility';

const CompatibilityBadge = ({ currentUser, otherUser }) => {
  const level = getCompatibility(currentUser, otherUser);

  if (level === 'none') return null;

  if (level === 'mutual') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Match!
      </span>
    );
  }

  if (level === 'one-way') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 text-xs">
        Te podría interesar
      </span>
    );
  }

  return null;
};

export default CompatibilityBadge;
