// Individual broadcast card (Phase 6.4)
import { useState, useEffect } from 'react';
import { getPinColor } from '../../utils/pinColors';

const BroadcastCard = ({ broadcast, vanillaMode }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const remaining = new Date(broadcast.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [broadcast.expiresAt]);

  const pinColor = getPinColor(broadcast.userType);

  return (
    <div className="bg-dark-200 rounded-xl p-3 border border-dark-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style={{ backgroundColor: pinColor }}>
          {broadcast.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm font-medium flex-1"
              style={vanillaMode ? { filter: 'blur(4px)' } : {}}>
          {broadcast.displayName}
        </span>
        <span className="text-xs text-gray-500">{timeLeft}</span>
      </div>
      <p className="text-sm text-gray-200" style={vanillaMode ? { filter: 'blur(6px)' } : {}}>
        {broadcast.message}
      </p>
      {broadcast.distanceKm !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          {broadcast.distanceKm < 1
            ? `${Math.round(broadcast.distanceKm * 1000)}m`
            : `${broadcast.distanceKm.toFixed(1)}km`}
        </p>
      )}
    </div>
  );
};

export default BroadcastCard;
