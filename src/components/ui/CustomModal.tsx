import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import PremiumButton from './PremiumButton';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/30 overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-on-surface/30 hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">{title}</h3>
                <p className="text-on-surface/50 font-medium leading-relaxed">{description}</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <PremiumButton 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  variant={variant === 'danger' ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {confirmText}
                </PremiumButton>
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-sm font-bold text-on-surface/40 hover:text-on-surface transition-colors"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
