// Onboarding screen 2: "Looking for..." (Phase 5.1)
// Multi-select for what type of connections the user is looking for

const SEEKING_OPTIONS = [
  { value: 'men', label: 'Men', icon: '👤' },
  { value: 'women', label: 'Women', icon: '👤' },
  { value: 'couples', label: 'Couples', icon: '👫' },
  { value: 'anyone', label: 'Everyone', icon: '🌍' }
];

const SeekingSelector = ({ selected, onToggle }) => {
  const handleToggle = (value) => {
    if (value === 'anyone') {
      if (selected.includes('anyone')) {
        onToggle([]);
      } else {
        onToggle(['men', 'women', 'couples', 'anyone']);
      }
    } else {
      let newSelected;
      if (selected.includes(value)) {
        newSelected = selected.filter(s => s !== value && s !== 'anyone');
      } else {
        newSelected = [...selected.filter(s => s !== 'anyone'), value];
        if (newSelected.includes('men') && newSelected.includes('women') && newSelected.includes('couples')) {
          newSelected.push('anyone');
        }
      }
      onToggle(newSelected);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Looking for...</h1>
      <p className="text-gray-400 text-sm mb-8">You can choose multiple</p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {SEEKING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
              selected.includes(opt.value)
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-100 bg-dark-200 hover:border-gray-600'
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="flex-1 text-left font-medium">{opt.label}</span>
            {selected.includes(opt.value) && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeekingSelector;
