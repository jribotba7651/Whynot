// Input para enviar broadcast (Fase 6.4)
// Con contador de caracteres y rate limit visual
import { useState, useEffect } from 'react';

const BroadcastInput = ({ onSend, isRegistered, lastSentAt }) => {
  const [text, setText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  // Countdown del rate limit (30 min)
  useEffect(() => {
    if (!lastSentAt) return;
    const update = () => {
      const elapsed = Date.now() - new Date(lastSentAt).getTime();
      const remaining = 30 * 60 * 1000 - elapsed;
      setCooldown(remaining > 0 ? remaining : 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastSentAt]);

  const handleSend = async () => {
    if (!text.trim() || text.length > 140 || cooldown > 0 || sending) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  };

  if (!isRegistered) {
    return (
      <div className="bg-dark-200 rounded-xl p-3 text-center">
        <p className="text-gray-400 text-xs">Crea una cuenta para enviar updates al área</p>
      </div>
    );
  }

  const formatCooldown = (ms) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.substring(0, 140))}
          placeholder="Envía un update al área..."
          rows={2}
          className="w-full bg-dark-200 border border-dark-100 rounded-xl px-3 py-2 text-white text-sm
                     focus:border-primary-500 focus:outline-none resize-none"
          disabled={cooldown > 0}
        />
        <span className="absolute right-2 bottom-2 text-[10px] text-gray-500">{text.length}/140</span>
      </div>

      {cooldown > 0 ? (
        <p className="text-xs text-gray-500 text-center">
          Siguiente broadcast en {formatCooldown(cooldown)}
        </p>
      ) : (
        <button
          onClick={handleSend}
          disabled={!text.trim() || text.length > 140 || sending}
          className="w-full py-2 bg-primary-600 rounded-xl text-sm font-medium text-white
                     hover:bg-primary-700 transition-colors disabled:opacity-40"
        >
          {sending ? 'Enviando...' : 'Enviar broadcast'}
        </button>
      )}
    </div>
  );
};

export default BroadcastInput;
