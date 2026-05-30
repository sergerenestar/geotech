'use client';

import Topbar from './Header';
import IconRail from './Sidebar';
import AppFooter from './Footer';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f5f7' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <IconRail />
        <main style={{ flex: 1, overflow: 'auto', background: '#f4f5f7', padding: '24px' }}>
          {children}
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
