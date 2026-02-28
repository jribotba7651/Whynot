// Componente de Pin de usuario
// Renderiza el marcador visual de un usuario en el mapa
// Usado para generar elementos DOM que Mapbox usa como custom markers

// Colores según lo que busca el usuario
const PIN_COLORS = {
  'amistad': '#3b82f6',    // Azul
  'citas': '#ec4899',      // Rosa
  'networking': '#10b981', // Verde
  'lo-que-sea': '#6b7280'  // Gris
};

// Crear elemento DOM para el pin (Mapbox requiere elementos DOM nativos)
export const createPinElement = (user, isCurrent = false) => {
  const el = document.createElement('div');

  if (isCurrent) {
    el.className = 'user-pin-current';
    return el;
  }

  // Pin de otro usuario
  const lookingFor = user.profile?.lookingFor || 'lo-que-sea';
  const color = PIN_COLORS[lookingFor] || PIN_COLORS['lo-que-sea'];

  el.className = 'user-pin-other';
  el.style.backgroundColor = color;

  // Mostrar inicial si tiene nombre
  if (user.isProfileComplete && user.displayName) {
    el.textContent = user.displayName[0].toUpperCase();
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.fontSize = '11px';
  }

  return el;
};

// Componente React para preview (no se usa directamente en el mapa)
const UserPin = ({ user, isCurrent = false, onClick }) => {
  const lookingFor = user?.profile?.lookingFor || 'lo-que-sea';

  if (isCurrent) {
    return <div className="user-pin-current" />;
  }

  return (
    <div
      className={`user-pin-other pin-${lookingFor}`}
      onClick={() => onClick?.(user)}
      style={{ cursor: 'pointer' }}
    >
      {user?.isProfileComplete && user?.displayName
        ? user.displayName[0].toUpperCase()
        : null
      }
    </div>
  );
};

export default UserPin;
