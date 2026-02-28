// Lógica de compatibilidad entre usuarios (Fase 5.4)
// Calcula si hay match mutuo basado en userType y seekingTypes

// Mapeo: qué "seekingType" corresponde a qué "userType"
const TYPE_TO_SEEKING = {
  man: 'men',
  woman: 'women',
  couple_mf: 'couples',
  couple_mm: 'couples',
  couple_ff: 'couples'
};

// Calcular nivel de compatibilidad entre dos usuarios
export const getCompatibility = (currentUser, otherUser) => {
  if (!currentUser?.seekingTypes?.length || !otherUser?.seekingTypes?.length ||
      !currentUser?.userType || !otherUser?.userType) {
    return 'none';
  }

  const iSeekThem = currentUser.seekingTypes.includes(TYPE_TO_SEEKING[otherUser.userType]) ||
                    currentUser.seekingTypes.includes('anyone');

  const theySeekMe = otherUser.seekingTypes.includes(TYPE_TO_SEEKING[currentUser.userType]) ||
                     otherUser.seekingTypes.includes('anyone');

  if (iSeekThem && theySeekMe) return 'mutual';   // Match mutuo
  if (iSeekThem && !theySeekMe) return 'one-way';  // Te podría interesar
  return 'none';
};
