import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'danger' | 'default';
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  options
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-surface rounded-t-[2.5rem] p-8 pb-12 shadow-2xl border-t border-outline-variant/30 overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-on-surface/10 rounded-full mx-auto mb-8" />

            <div className="space-y-6">
              {title && (
                <p className="text-center text-xs font-bold uppercase tracking-widest text-on-surface/30 mb-2">{title}</p>
              )}
              <div className="space-y-3">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      option.onClick();
                      onClose();
                    }}
                    className={`
                      w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold transition-all active:scale-[0.98]
                      ${option.variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-surface-low text-on-surface hover:bg-surface-highest'}
                    `}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
                
                <button
                  onClick={onClose}
                  className="w-full py-5 text-on-surface/40 font-bold hover:text-on-surface transition-colors mt-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActionSheet;
