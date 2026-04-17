import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { generateCalendarMatrix, WEEK_DAYS, MONTH_NAMES } from '../../lib/dateUtils';

interface PremiumDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({ value, onChange, placeholder = "Select Date", icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for the calendar view (which month/year we are looking at)
  const initialDate = value && !isNaN(new Date(value + 'T00:00:00').getTime())
    ? new Date(value + 'T00:00:00')
    : new Date();
  
  const [viewDate, setViewDate] = useState(initialDate);

  // Sync viewDate when value is loaded (important for Edit Mode if fetched later)
  useEffect(() => {
    if (value) {
      const newInitialDate = new Date(value + 'T00:00:00');
      if (!isNaN(newInitialDate.getTime())) {
        setViewDate(newInitialDate);
      }
    }
  }, [value]);

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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Format to YYYY-MM-DD local time
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  // formatting display date
  const displayDateText = value 
    ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : placeholder;

  const matrix = generateCalendarMatrix(viewDate);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer w-full"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30 pl-1 pointer-events-none">
          {icon || <CalendarIcon size={18} />}
        </div>
        <div 
          className={`w-full bg-transparent border-b py-3 pl-9 pr-4 flex items-center justify-between transition-colors
            ${isOpen ? 'border-primary' : 'border-outline-variant/30 hover:border-outline-variant'}
            ${value ? 'text-on-surface/70 font-medium' : 'text-on-surface/30'}`}
        >
          <span>{displayDateText}</span>
        </div>
      </div>

      {/* Pop-up Calendar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute top-full left-0 w-full md:w-[320px] mt-2 bg-surface-lowest border border-outline-variant/20 rounded-2xl shadow-2xl z-50 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-surface-low rounded-full transition-colors text-on-surface/70">
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-on-surface tracking-wide">
                {!isNaN(viewDate.getTime()) ? `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}` : 'Select Month'}
              </span>
              <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-surface-low rounded-full transition-colors text-on-surface/70">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEK_DAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-on-surface/40 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {matrix.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="w-8 h-8 md:w-10 md:h-10"></div>;
                }

                // Check if this cell is the selected date
                const isSelected = value && 
                                   viewDate.getFullYear() === parseInt(value.split('-')[0]) &&
                                   viewDate.getMonth() + 1 === parseInt(value.split('-')[1]) &&
                                   day === parseInt(value.split('-')[2]);

                return (
                  <button
                    key={`${viewDate.getFullYear()}-${viewDate.getMonth()}-${day}`}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={`
                      w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-on-surface/80 hover:bg-surface hover:text-primary'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumDatePicker;
