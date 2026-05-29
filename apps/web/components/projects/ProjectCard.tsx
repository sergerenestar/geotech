'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface ProjectCardProps {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  createdAt: string;
  onDelete?: () => void;
}

export default function ProjectCard({ id, projectCode, name, status, createdAt, onDelete }: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <div className="bg-surface rounded-card shadow-card p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-mono text-gray-500">{projectCode}</span>
          <Badge status={status} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3">{name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {new Date(createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer le projet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
