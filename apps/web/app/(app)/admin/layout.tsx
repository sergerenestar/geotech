'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for session restore before redirecting
    if (accessToken !== null && user && user.role !== 'ADMIN') {
      router.replace('/projects');
    }
  }, [user, accessToken, router]);

  if (!user || user.role !== 'ADMIN') return null;

  return <>{children}</>;
}
