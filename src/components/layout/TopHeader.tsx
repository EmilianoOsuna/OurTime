import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfilePanel from '../ui/ProfilePanel';

const TopHeader: React.FC = () => {
  const { user, profile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Tú';
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-surface/50 border-b border-white/20 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Our Time Logo" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-on-surface tracking-tight text-lg pt-0.5">Our Time</span>
          </div>

          {/* Right: Profile Trigger */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 bg-surface-low rounded-full border border-outline-variant/30 p-1 pl-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 active:scale-95"
          >
            {/* Name */}
            <span className="text-xs font-bold text-on-surface max-w-[90px] truncate">
              {displayName}
            </span>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 border-2 border-white shadow flex items-center justify-center flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-extrabold text-sm uppercase leading-none">
                  {displayName.charAt(0)}
                </span>
              )}
            </div>
          </button>

        </div>
      </header>

      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default TopHeader;
