// Tarjeta de perfil de otro usuario
// Se muestra al tocar un pin en el mapa, antes de abrir el chat
import Avatar from '../UI/Avatar';

// Etiquetas de "lookingFor" en español
const LOOKING_FOR_LABELS = {
  'amistad': { label: 'Amistad', color: 'bg-blue-500/20 text-blue-300' },
  'citas': { label: 'Citas', color: 'bg-pink-500/20 text-pink-300' },
  'networking': { label: 'Networking', color: 'bg-green-500/20 text-green-300' },
  'lo-que-sea': { label: 'Lo que sea', color: 'bg-gray-500/20 text-gray-300' }
};

const ProfileCard = ({ user, onMessage, onClose, distance }) => {
  if (!user) return null;

  const lookingForInfo = LOOKING_FOR_LABELS[user.profile?.lookingFor] || LOOKING_FOR_LABELS['lo-que-sea'];

  // Formatear distancia
  const formatDistance = (km) => {
    if (!km && km !== 0) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-sm bg-dark-300 rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up">
        {/* Header con gradiente */}
        <div className="relative h-20 bg-gradient-to-r from-primary-600 to-accent-600">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center
                       hover:bg-black/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center -mt-8">
          <Avatar
            name={user.displayName}
            userId={user.id}
            avatarUrl={user.profile?.avatar}
            size="xl"
            className="border-4 border-dark-300"
          />
        </div>

        {/* Info */}
        <div className="px-5 pt-3 pb-5">
          <div className="text-center">
            <h3 className="text-lg font-bold">
              {user.displayName || 'Usuario'}
              {user.profile?.age && user.profile?.showAge !== false && (
                <span className="text-gray-400 font-normal">, {user.profile.age}</span>
              )}
            </h3>

            {/* Distancia y estado */}
            <div className="flex items-center justify-center gap-2 mt-1 text-sm">
              {user.isOnline !== undefined && (
                <span className={user.isOnline ? 'text-green-400' : 'text-gray-500'}>
                  {user.isOnline ? 'En línea' : 'Desconectado'}
                </span>
              )}
              {distance !== null && distance !== undefined && user.profile?.showDistance !== false && (
                <>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">{formatDistance(distance)}</span>
                </>
              )}
            </div>
          </div>

          {/* Buscando */}
          {user.isProfileComplete && (
            <div className="mt-3 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${lookingForInfo.color}`}>
                Buscando: {lookingForInfo.label}
              </span>
            </div>
          )}

          {/* Bio */}
          {user.profile?.bio && (
            <p className="text-sm text-gray-300 mt-3 text-center">
              {user.profile.bio}
            </p>
          )}

          {/* Intereses */}
          {user.profile?.interests?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {user.profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 bg-dark-200 rounded-full text-xs text-gray-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Botón de mensaje */}
          <button
            onClick={() => onMessage(user)}
            className="w-full mt-5 py-3 rounded-xl bg-primary-600 text-white font-medium
                       hover:bg-primary-700 transition-colors"
          >
            Enviar mensaje
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
