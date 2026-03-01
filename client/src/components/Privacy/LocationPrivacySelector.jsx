// Location privacy selector (Phase 6.1)
// Allows the user to choose their randomization radius
const PRIVACY_OPTIONS = [
  { value: 50, label: 'Precise', desc: '50m — easy to find' },
  { value: 500, label: 'General area', desc: '500m — recommended' },
  { value: 1000, label: 'Wide area', desc: '1km — maximum anonymity' }
];

const LocationPrivacySelector = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">Location privacy</label>
      <p className="text-xs text-gray-500 mb-3">
        Other users will see your pin with a random offset within this radius
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
