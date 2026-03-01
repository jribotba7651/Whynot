// Pin color constants by user type (Phase 5.2)
// and mapping utilities for display

export const PIN_COLORS = {
  man: '#3B82F6',        // Blue
  woman: '#F472B6',      // Coral
  couple_mf: '#8B5CF6',  // Purple
  couple_mm: '#1E40AF',  // Dark blue
  couple_ff: '#BE185D',  // Dark pink
  unknown: '#6B7280'     // Gray
};

export const USER_TYPE_LABELS = {
  man: 'Man',
  woman: 'Woman',
  couple_mf: 'Couple M+F',
  couple_mm: 'Couple M+M',
  couple_ff: 'Couple F+F'
};

export const SEEKING_LABELS = {
  men: 'Men',
  women: 'Women',
  couples: 'Couples',
  anyone: 'Everyone'
};

// Check if a userType is a couple
export const isCouple = (userType) =>
  ['couple_mf', 'couple_mm', 'couple_ff'].includes(userType);

// Get pin color by userType
export const getPinColor = (userType) =>
  PIN_COLORS[userType] || PIN_COLORS.unknown;

// Format seekingTypes for display
export const formatSeeking = (seekingTypes) => {
  if (!seekingTypes?.length) return '';
  if (seekingTypes.includes('anyone')) return 'Everyone';
  return seekingTypes.map(s => SEEKING_LABELS[s]).join(', ');
};
