// Contador de vibes de un usuario (Fase 6.5)
const VibeCounter = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-yellow-300">
      {count} {count === 1 ? 'vibe' : 'vibes'}
    </span>
  );
};

export default VibeCounter;
