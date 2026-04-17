import React from 'react';

interface PremiumFilterProps {
  options: string[];
  activeOption: string;
  onChange: (option: string) => void;
}

const PremiumFilter: React.FC<PremiumFilterProps> = ({ options, activeOption, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {options.map((option) => {
        const isActive = activeOption === option;
        
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`
              px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm
              ${isActive 
                ? 'bg-primary text-white border-transparent' 
                : 'bg-surface-lowest/50 backdrop-blur-md border border-outline-variant/30 text-on-surface/60 hover:border-outline-variant hover:text-on-surface'
              }
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default PremiumFilter;
