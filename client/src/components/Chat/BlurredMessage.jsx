// Mensaje con blur para modo discreto (Fase 6.3)
// Tap para revelar el contenido
import { useState } from 'react';

const BlurredMessage = ({ text, isOwn }) => {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <p className="break-words">{text}</p>;
  }

  return (
    <p
      onClick={() => setRevealed(true)}
      className="break-words cursor-pointer select-none"
      style={{ filter: 'blur(6px)' }}
    >
      {text}
      <span className="block text-[10px] mt-1 opacity-60" style={{ filter: 'none' }}>
        Toca para ver
      </span>
    </p>
  );
};

export default BlurredMessage;
