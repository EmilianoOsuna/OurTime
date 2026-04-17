import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
  onDelete?: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  onDelete
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 m-0 h-screen h-[100dvh] w-full overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />

          {/* Controls Container */}
          <div className="absolute top-0 inset-x-0 p-8 flex justify-between z-[130]">
             {onDelete && (
               <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-4 bg-red-500/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all duration-300"
                title="Eliminar Memoria"
              >
                <Trash2 size={24} />
              </motion.button>
             )}
             
             <div className="flex-1" />

             <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={onClose}
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* Image Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="relative w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center p-4 select-none pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageUrl} 
              alt={caption} 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl pointer-events-auto"
            />
            {caption && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-6 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-auto shadow-sm"
               >
                 <p className="text-white font-bold text-lg">{caption}</p>
               </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
