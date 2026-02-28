// Hook para modo discreto (Fase 6.3)
// Maneja el estado global de vanillaMode con persistencia en localStorage
import { useState, useCallback, useEffect } from 'react';

const useVanillaMode = () => {
  const [vanillaMode, setVanillaMode] = useState(() => {
    return localStorage.getItem('whynot_vanilla') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('whynot_vanilla', vanillaMode.toString());
  }, [vanillaMode]);

  const toggleVanilla = useCallback(() => {
    setVanillaMode(prev => !prev);
  }, []);

  return { vanillaMode, toggleVanilla };
};

export default useVanillaMode;
