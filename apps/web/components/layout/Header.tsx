'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onLanguageChange?: (lang: string) => void;
  currentLang?: string;
}

export default function Header({ onLanguageChange, currentLang = 'fr' }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-brand-gradient flex items-center justify-between px-6 shadow-sm">
      <span className="text-white font-bold text-lg tracking-tight">GeoTech Lab</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onLanguageChange?.(currentLang === 'fr' ? 'en' : 'fr')}
          className="text-white/80 hover:text-white text-sm font-medium px-2 py-1 rounded"
        >
          {currentLang === 'fr' ? 'EN' : 'FR'}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            {user?.firstName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <button onClick={handleLogout} className="text-white/70 hover:text-white text-xs">
            {currentLang === 'fr' ? 'Déconnexion' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
}
