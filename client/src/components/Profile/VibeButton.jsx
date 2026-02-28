// Botón para dar vibe positiva (Fase 6.5)
// Estados: disponible, ya dada, no disponible
import { useState, useEffect } from 'react';
import { giveVibe, checkVibe } from '../../services/api';

const VibeButton = ({ userId, onVibeGiven }) => {
  const [status, setStatus] = useState('loading'); // loading, available, given, unavailable
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkVibe(userId).then(data => {
      if (cancelled) return;
      if (data.hasGivenVibe) setStatus('given');
      else if (data.canGiveVibe) setStatus('available');
      else setStatus('unavailable');
    }).catch(() => setStatus('unavailable'));
    return () => { cancelled = true; };
  }, [userId]);

  const handleGiveVibe = async () => {
    if (status !== 'available') return;
    try {
      const result = await giveVibe(userId);
      setStatus('given');
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
      onVibeGiven?.(result.newVibeCount);
    } catch (err) {
      console.error('Error dando vibe:', err.message);
    }
  };

  if (status === 'loading' || status === 'unavailable') return null;

  if (status === 'given') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-yellow-300 ${animating ? 'animate-bounce' : ''}`}>
        Ya diste vibe
      </span>
    );
  }

  return (
    <button
      onClick={handleGiveVibe}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs
                 hover:bg-yellow-500/30 transition-colors"
    >
      + Dar vibe
    </button>
  );
};

export default VibeButton;
