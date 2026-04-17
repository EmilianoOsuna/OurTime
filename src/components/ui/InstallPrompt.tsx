import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'ourtime_install_dismissed';

const InstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOSDevice) {
      setIsIOS(true);
      // Show iOS instructions after a short delay
      setTimeout(() => setIsVisible(true), 3000);
      return;
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      // Show the prompt after a short delay to not be intrusive
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-24 left-4 right-4 z-[9998] max-w-sm mx-auto"
        >
          <div className="bg-surface-lowest border border-outline-variant/20 rounded-3xl shadow-2xl shadow-primary/10 p-5 flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
              <img src="/pwa-192x192.png" alt="Our Time" className="w-full h-full object-cover" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-on-surface text-sm">Añadir a Inicio</p>
              {isIOS ? (
                <p className="text-xs text-on-surface/60 mt-1 leading-relaxed">
                  Toca <span className="font-bold">Compartir</span> y luego{' '}
                  <span className="font-bold">"Añadir a pantalla de inicio"</span> para instalarla.
                </p>
              ) : (
                <p className="text-xs text-on-surface/60 mt-1 leading-relaxed">
                  Instala la app para acceder sin el navegador.
                </p>
              )}

              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <Download size={14} />
                  Instalar
                </button>
              )}
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-on-surface/40 hover:text-on-surface hover:bg-surface-low rounded-full transition-colors flex-shrink-0 -mt-1 -mr-1"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
