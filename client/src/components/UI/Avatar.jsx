// Componente reutilizable de Avatar
// Genera avatares con iniciales y color de fondo basado en hash del userId
// Opcionalmente usa DiceBear API para avatares más variados

// Generar color de fondo consistente basado en un string (userId)
const stringToColor = (str) => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Obtener iniciales de un nombre
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const Avatar = ({ name, userId, size = 'md', avatarUrl, className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  const bgColor = stringToColor(userId || name);

  // Si tiene URL de avatar (DiceBear), usarla
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  // Avatar con iniciales
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
