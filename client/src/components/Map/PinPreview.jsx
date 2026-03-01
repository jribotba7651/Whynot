// Mini-preview when tapping a pin (Phase 5.2)
// Shows compact info with compatibility badge
import Avatar from '../UI/Avatar';
import CompatibilityBadge from '../Profile/CompatibilityBadge';
import VibeCounter from '../Profile/VibeCounter';
import { USER_TYPE_LABELS, formatSeeking } from '../../utils/pinColors';

const PinPreview = ({ user, currentUser, onViewProfile, onClose, vanillaMode }) => {
  if (!user) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
      <div className="bg-dark-200/95 backdrop-blur-sm border border-dark-100 rounded-2xl p-3 shadow-xl min-w-[220px] max-w-[280px]">
        <div className="flex items-center gap-3">
          <div style={vanillaMode ? { filter: 'blur(8px)' } : {}}>
            <Avatar
              name={user.displayName}
              userId={user.id}
              avatarUrl={user.profile?.avatar}
              size="sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-gray-400">
              {USER_TYPE_LABELS[user.userType] || 'No type'}
              {user.seekingTypes?.length > 0 && (
                <span> · Looking for: {formatSeeking(user.seekingTypes)}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <CompatibilityBadge currentUser={currentUser} otherUser={user} />
          <VibeCounter count={user.vibeCount} />
        </div>

        {/* View profile button */}
        <button
          onClick={() => onViewProfile(user)}
          className="w-full mt-2 py-2 bg-primary-600/80 rounded-xl text-xs font-medium
                     hover:bg-primary-700 transition-colors"
        >
          View profile
        </button>
      </div>
    </div>
  );
};

export default PinPreview;
