// Map filter bar (Phase 5.3)
// Toggleable chips to filter which user types to see
import { useState, useEffect } from 'react';

const FILTERS = [
  { key: 'men', label: 'Men', types: ['man'] },
  { key: 'women', label: 'Women', types: ['woman'] },
  { key: 'couples', label: 'Couples', types: ['couple_mf', 'couple_mm', 'couple_ff'] }
];

const FilterBar = ({ seekingTypes, onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState(() => {
    const saved = localStorage.getItem('whynot_filters');
    if (saved) return JSON.parse(saved);
    if (!seekingTypes?.length) return ['men', 'women', 'couples'];
    const filters = [];
    if (seekingTypes.includes('men') || seekingTypes.includes('anyone')) filters.push('men');
    if (seekingTypes.includes('women') || seekingTypes.includes('anyone')) filters.push('women');
    if (seekingTypes.includes('couples') || seekingTypes.includes('anyone')) filters.push('couples');
    return filters;
  });

  useEffect(() => {
    localStorage.setItem('whynot_filters', JSON.stringify(activeFilters));
    const visibleTypes = new Set();
    activeFilters.forEach(filter => {
      const f = FILTERS.find(ff => ff.key === filter);
      if (f) f.types.forEach(t => visibleTypes.add(t));
    });
    onFilterChange(visibleTypes);
  }, [activeFilters, onFilterChange]);

  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      if (prev.includes(key)) return prev.filter(f => f !== key);
      return [...prev, key];
    });
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 overflow-x-auto no-scrollbar">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => toggleFilter(filter.key)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm ${
            activeFilters.includes(filter.key)
              ? 'bg-primary-600/90 text-white border border-primary-500'
              : 'bg-dark-200/80 text-gray-400 border border-dark-100 hover:text-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
