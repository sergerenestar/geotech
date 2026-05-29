'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-56 min-h-full bg-sidebar flex flex-col py-6">
      <nav className="flex flex-col gap-1 px-3">
        {[
          { href: '/projects', label: 'Projets', show: true },
          { href: '/admin/users', label: 'Utilisateurs', show: isAdmin },
        ].filter(item => item.show).map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-cyan-400 bg-white/10 border-l-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
