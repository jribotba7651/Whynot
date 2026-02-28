// Constantes de colores de pins por tipo de usuario (Fase 5.2)
// y utilidades de mapeo para display en español

export const PIN_COLORS = {
  man: '#3B82F6',        // Azul
  woman: '#F472B6',      // Coral
  couple_mf: '#8B5CF6',  // Morado
  couple_mm: '#1E40AF',  // Azul oscuro
  couple_ff: '#BE185D',  // Rosa oscuro
  unknown: '#6B7280'     // Gris
};

export const USER_TYPE_LABELS = {
  man: 'Hombre',
  woman: 'Mujer',
  couple_mf: 'Pareja H+M',
  couple_mm: 'Pareja H+H',
  couple_ff: 'Pareja M+M'
};

export const SEEKING_LABELS = {
  men: 'Hombres',
  women: 'Mujeres',
  couples: 'Parejas',
  anyone: 'Todos'
};

// Verificar si un userType es pareja
export const isCouple = (userType) =>
  ['couple_mf', 'couple_mm', 'couple_ff'].includes(userType);

// Obtener color del pin según userType
export const getPinColor = (userType) =>
  PIN_COLORS[userType] || PIN_COLORS.unknown;

// Formatear seekingTypes para display
export const formatSeeking = (seekingTypes) => {
  if (!seekingTypes?.length) return '';
  if (seekingTypes.includes('anyone')) return 'Todos';
  return seekingTypes.map(s => SEEKING_LABELS[s]).join(', ');
};
