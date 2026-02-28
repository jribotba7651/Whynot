// Selector de privacidad de ubicación (Fase 6.1)
// Permite al usuario elegir su radio de randomización
const PRIVACY_OPTIONS = [
  { value: 50, label: 'Precisa', desc: '50m — fácil de encontrar' },
  { value: 500, label: 'Zona general', desc: '500m — recomendado' },
  { value: 1000, label: 'Área amplia', desc: '1km — máximo anonimato' }
];

const LocationPrivacySelector = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">Privacidad de ubicación</label>
      <p className="text-xs text-gray-500 mb-3">
        Otros usuarios verán tu pin con un offset aleatorio dentro de este radio
      </p>
      <div className="space-y-2">
        {PRIVACY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
              value === opt.value
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-100 bg-dark-200 hover:border-gray-600'
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span className="text-xs text-gray-400 ml-2">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationPrivacySelector;
