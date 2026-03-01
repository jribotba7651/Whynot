// Block user button (Phase 6.2)
// With confirmation before executing
import { useState } from 'react';
import { blockUser } from '../../services/api';

const BlockButton = ({ userId, userName, onBlocked, className = '' }) => {
  const [confirming, setConfirming] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await blockUser(userId);
      onBlocked?.();
    } catch (err) {
      console.error('Error blocking:', err.message);
    } finally {
      setBlocking(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className={`bg-red-900/20 border border-red-800/50 rounded-xl p-3 ${className}`}>
        <p className="text-red-300 text-xs mb-2">
          Block {userName || 'this user'}? They won't be able to see or contact you.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-1.5 bg-dark-200 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleBlock}
            disabled={blocking}
            className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs disabled:opacity-40"
          >
            {blocking ? '...' : 'Block'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`text-red-400 text-xs hover:text-red-300 transition-colors ${className}`}
    >
      Block user
    </button>
  );
};

export default BlockButton;
