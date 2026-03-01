// User report modal (Phase 6.2)
// Allows selecting a reason and sending optional details
import { useState } from 'react';
import { reportUser } from '../../services/api';

const REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or abusive behavior' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'underage', label: 'Suspected underage user' },
  { value: 'other', label: 'Other reason' }
];

const ReportModal = ({ isOpen, onClose, userId }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setSending(true);
    setError('');

    try {
      await reportUser(userId, reason, details);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setSent(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 animate-fade-in px-4">
      <div className="bg-dark-300 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-center">Report user</h3>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-green-400 font-medium">Report sent</p>
            <p className="text-gray-400 text-sm mt-2">Thank you for helping us keep the community safe.</p>
            <button onClick={handleClose} className="mt-5 px-6 py-2 bg-dark-200 rounded-xl text-sm">
              Close
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <p className="text-gray-400 text-sm">Select the reason for reporting:</p>

            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                  reason === r.value
                    ? 'border-red-500 bg-red-500/10 text-red-300'
                    : 'border-dark-100 bg-dark-200 hover:border-gray-600'
                }`}
              >
                {r.label}
              </button>
            ))}

            {reason === 'other' && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.substring(0, 500))}
                placeholder="Describe the problem..."
                rows={3}
                className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm
                           focus:border-red-500 focus:outline-none resize-none"
              />
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={handleClose} className="flex-1 py-3 bg-dark-200 rounded-xl text-sm">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || sending}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm disabled:opacity-40"
              >
                {sending ? 'Sending...' : 'Send report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
