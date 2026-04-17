import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface PremiumSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ options, value, onChange, placeholder = "Select...", icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer w-full"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30 pl-1 pointer-events-none">
          {icon}
        </div>
        <div 
          className={`w-full bg-transparent border-b py-3 pl-9 pr-8 flex items-center justify-between transition-colors
            ${isOpen ? 'border-primary' : 'border-outline-variant/30 hover:border-outline-variant'}
            ${selectedOption ? 'text-on-surface/70 font-medium' : 'text-on-surface/30'}`}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-on-surface/30"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute top-full left-0 w-full mt-2 bg-surface-lowest border border-outline-variant/20 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <ul className="py-2 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-5 py-3 cursor-pointer transition-colors text-sm font-medium
                    ${value === option.value ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-low'}`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumSelect;
