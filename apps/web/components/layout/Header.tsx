'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string | undefined;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled: !!projectId,
    staleTime: 30000,
  });

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header style={{
      height: 44,
      minHeight: 44,
      background: '#1c2333',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      flexShrink: 0,
      borderBottom: '1px solid #2e3d52',
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: '#e2e8f0',
        letterSpacing: '0.04em',
        paddingRight: 16,
        borderRight: '1px solid #2e3d52',
        marginRight: 16,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        GeoTech Lab
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flex: 1, minWidth: 0 }}>
        {project ? (
          <>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
              {project.projectCode}
            </span>
            <span style={{ color: '#2e3d52', flexShrink: 0 }}>›</span>
            <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
            <span style={{
              fontSize: 9,
              letterSpacing: '0.1em',
              padding: '2px 7px',
              borderRadius: 10,
              background: '#1e3a5f',
              color: '#60a5fa',
              border: '1px solid #2d5a8e',
              textTransform: 'uppercase',
              marginLeft: 4,
              fontWeight: 500,
              flexShrink: 0,
            }}>
              {project.status}
            </span>
          </>
        ) : (
          <span style={{ color: '#64748b' }}>Projets</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            fontSize: 10,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid #2e3d52',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Déconnexion
        </button>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#2e3d52',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          color: '#e2e8f0',
        }}>
          {initials}
        </div>
      </div>
    </header>
  );
}
