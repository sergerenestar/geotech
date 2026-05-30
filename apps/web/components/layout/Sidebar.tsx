'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CSSProperties } from 'react';

function NavIcon({
  href,
  icon,
  active,
  title,
}: {
  href: string;
  icon: string;
  active: boolean;
  title: string;
}) {
  const style: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#0e7490' : 'transparent',
    color: active ? '#e0f7fa' : '#4a6080',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  };

  return (
    <Link href={href} title={title} style={{ textDecoration: 'none' }}>
      <div style={style}>
        <i className={`ti ${icon}`} style={{ fontSize: 18 }} />
      </div>
    </Link>
  );
}

export default function IconRail() {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const projectId = params?.id as string | undefined;

  const onProjectsRoot = pathname === '/projects';
  const onAdminPage = pathname.startsWith('/admin');

  return (
    <aside style={{
      width: 52,
      minWidth: 52,
      background: '#1e2a3a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      gap: 2,
      flexShrink: 0,
      borderRight: '1px solid #161f2e',
    }}>
      <NavIcon href="/projects" icon="ti-flask" active={onProjectsRoot} title="Essais" />
      {projectId && (
        <NavIcon
          href={`/projects/${projectId}`}
          icon="ti-layers-difference"
          active={!!projectId && !onAdminPage}
          title="Forages"
        />
      )}
      <NavIcon href="/projects" icon="ti-folder" active={false} title="Projets" />

      <div style={{ width: 24, height: 1, background: '#2e3d52', margin: '4px 0' }} />

      {isAdmin && (
        <NavIcon href="/admin/users" icon="ti-users" active={onAdminPage} title="Utilisateurs" />
      )}

      <div style={{ flex: 1 }} />
      <NavIcon href="/settings" icon="ti-settings" active={pathname === '/settings'} title="Paramètres" />
    </aside>
  );
}
