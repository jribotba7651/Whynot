// Pantalla 1 del onboarding: "Soy..." (Fase 5.1)
// Selector visual de tipo de usuario con cards grandes
import { PIN_COLORS, USER_TYPE_LABELS } from '../../utils/pinColors';

const USER_TYPE_OPTIONS = [
  { value: 'man', icon: '👤', color: PIN_COLORS.man },
  { value: 'woman', icon: '👤', color: PIN_COLORS.woman },
  { value: 'couple_mf', icon: '👫', color: PIN_COLORS.couple_mf },
  { value: 'couple_mm', icon: '👬', color: PIN_COLORS.couple_mm },
  { value: 'couple_ff', icon: '👭', color: PIN_COLORS.couple_ff }
];

const UserTypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-col items-center px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Soy...</h1>
      <p className="text-gray-400 text-sm mb-8">Selecciona cómo te identificas</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {USER_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${
              selected === opt.value
                ? 'border-white bg-white/10 scale-105'
                : 'border-dark-100 bg-dark-200 hover:border-gray-600'
            }`}
            style={selected === opt.value ? { borderColor: opt.color, boxShadow: `0 0 20px ${opt.color}30` } : {}}
          >
            <span className="text-3xl mb-2">{opt.icon}</span>
            <span className="text-sm font-medium">{USER_TYPE_LABELS[opt.value]}</span>
            {selected === opt.value && (
              <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: opt.color }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserTypeSelector;
