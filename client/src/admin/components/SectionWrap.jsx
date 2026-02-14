import { SECTION_LABELS } from '../utils/api.js';
import { Icon, I } from '../utils/icons.jsx';

export const SectionWrap = ({ type, children, isVisible, onToggleVisibility }) => {
  const meta = SECTION_LABELS[type] || { label: type, color: '#94a3b8' };

  return (
    <div className="relative group/sw">
      {/* actual content */}
      <div className={`transition-all duration-300 ${!isVisible ? 'opacity-30 saturate-0 pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Hover ring */}
      <div
        className="absolute inset-0 ring-0 group-hover/sw:ring-2 ring-inset ring-transparent transition-all duration-200 pointer-events-none rounded"
        style={{ '--tw-ring-color': meta.color + '55' }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover/sw:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 2px ${meta.color}44` }}
      />

      {/* Controls — top right, fade in on hover */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-0 group-hover/sw:opacity-100 transition-all duration-200 pointer-events-none group-hover/sw:pointer-events-auto">
        {/* Section badge */}
        <span
          className="text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm"
          style={{ background: meta.color }}
        >
          {meta.label}
        </span>

        {/* Visibility toggle */}
        <button
          onClick={onToggleVisibility}
          className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-wide transition-all shadow-sm border ${
            isVisible
              ? 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              : 'bg-red-100 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
          }`}
        >
          <Icon d={isVisible ? I.eye : I.eyeOff} size={10} />
          {isVisible ? 'Visible' : 'Hidden'}
        </button>
      </div>
    </div>
  );
};
