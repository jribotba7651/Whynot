// Tarjeta de perfil de otro usuario
// Integra: compatibilidad, vibes, reportar, bloquear
import { useState } from 'react';
import Avatar from '../UI/Avatar';
import CompatibilityBadge from './CompatibilityBadge';
import VibeButton from './VibeButton';
import VibeCounter from './VibeCounter';
import ReportModal from '../Safety/ReportModal';
import BlockButton from '../Safety/BlockButton';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPE_LABELS, formatSeeking } from '../../utils/pinColors';

const LOOKING_FOR_LABELS = {
  'amistad': { label: 'Amistad', color: 'bg-blue-500/20 text-blue-300' },
  'citas': { label: 'Citas', color: 'bg-pink-500/20 text-pink-300' },
  'networking': { label: 'Networking', color: 'bg-green-500/20 text-green-300' },
  'lo-que-sea': { label: 'Lo que sea', color: 'bg-gray-500/20 text-gray-300' }
};

const ProfileCard = ({ user: profileUser, onMessage, onClose, distance }) => {
  const { user: currentUser } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [blocked, setBlocked] = useState(false);

  if (!profileUser || blocked) return null;

  const lookingForInfo = LOOKING_FOR_LABELS[profileUser.profile?.lookingFor] || LOOKING_FOR_LABELS['lo-que-sea'];

  const formatDistance = (km) => {
    if (!km && km !== 0) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/50 animate-fade-in">
        <div className="w-full max-w-sm bg-dark-300 rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up">
          {/* Header con gradiente */}
          <div className="relative h-20 bg-gradient-to-r from-primary-600 to-accent-600">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Menú de opciones */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showOptions && (
              <div className="absolute top-12 left-3 bg-dark-200 border border-dark-100 rounded-xl shadow-xl overflow-hidden min-w-[160px] z-10 animate-fade-in">
                <button
                  onClick={() => { setShowOptions(false); setShowReport(true); }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-dark-100 transition-colors text-yellow-400"
                >
                  Reportar
                </button>
                <div className="px-4 py-3 hover:bg-dark-100 transition-colors">
                  <BlockButton
                    userId={profileUser.id}
                    userName={profileUser.displayName}
                    onBlocked={() => { setBlocked(true); onClose(); }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-8">
            <Avatar
              name={profileUser.displayName}
              userId={profileUser.id}
              avatarUrl={profileUser.profile?.avatar}
              size="xl"
              className="border-4 border-dark-300"
            />
          </div>

          {/* Info */}
          <div className="px-5 pt-3 pb-5">
            <div className="text-center">
              {/* Badge de compatibilidad */}
              <div className="flex justify-center mb-2">
                <CompatibilityBadge currentUser={currentUser} otherUser={profileUser} />
              </div>

              <h3 className="text-lg font-bold">
                {profileUser.displayName || 'Usuario'}
                {profileUser.profile?.age && profileUser.profile?.showAge !== false && (
                  <span className="text-gray-400 font-normal">, {profileUser.profile.age}</span>
                )}
              </h3>

              {/* Tipo de usuario */}
              {profileUser.userType && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {USER_TYPE_LABELS[profileUser.userType]}
                  {profileUser.seekingTypes?.length > 0 && (
                    <span> · Busca: {formatSeeking(profileUser.seekingTypes)}</span>
                  )}
                </p>
              )}

              {/* Distancia y estado */}
              <div className="flex items-center justify-center gap-2 mt-1 text-sm">
                {profileUser.isOnline !== undefined && (
                  <span className={profileUser.isOnline ? 'text-green-400' : 'text-gray-500'}>
                    {profileUser.isOnline ? 'En línea' : 'Desconectado'}
                  </span>
                )}
                {distance !== null && distance !== undefined && profileUser.profile?.showDistance !== false && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-400">{formatDistance(distance)}</span>
                  </>
                )}
              </div>

              {/* Vibes */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <VibeCounter count={profileUser.vibeCount} />
                <VibeButton userId={profileUser.id} />
              </div>
            </div>

            {profileUser.isProfileComplete && (
              <div className="mt-3 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${lookingForInfo.color}`}>
                  Buscando: {lookingForInfo.label}
                </span>
              </div>
            )}

            {profileUser.profile?.bio && (
              <p className="text-sm text-gray-300 mt-3 text-center">{profileUser.profile.bio}</p>
            )}

            {profileUser.profile?.interests?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {profileUser.profile.interests.map((interest) => (
                  <span key={interest} className="px-2 py-0.5 bg-dark-200 rounded-full text-xs text-gray-300">
                    {interest}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onMessage(profileUser)}
              className="w-full mt-5 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              Enviar mensaje
            </button>
          </div>
        </div>
      </div>

      {showOptions && <div className="fixed inset-0 z-39" onClick={() => setShowOptions(false)} />}

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} userId={profileUser.id} />
    </>
  );
};

export default ProfileCard;
