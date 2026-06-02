'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PmProjectView from '@/components/project/PmProjectView';
import LmProjectView from '@/components/project/LmProjectView';
import TechProjectView from '@/components/project/TechProjectView';
import ClientProjectView from '@/components/project/ClientProjectView';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!user) return <p style={{ fontSize: 12, color: '#94a3b8', padding: 24 }}>Chargement...</p>;

  const role = user.role;

  if (role === 'PROJECT_MANAGER' || role === 'ADMIN') return <PmProjectView projectId={id} />;
  if (role === 'LAB_MANAGER') return <LmProjectView projectId={id} />;
  if (role === 'TECHNICIAN' || role === 'USER') return <TechProjectView projectId={id} />;
  if (role === 'CLIENT') return <ClientProjectView projectId={id} />;

  return <p style={{ fontSize: 12, color: '#ef4444', padding: 24 }}>Accès non autorisé.</p>;
}
