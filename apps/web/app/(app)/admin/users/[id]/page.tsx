'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAdminUser, useUserMutations, useUserNotes, useNoteMutations } from '@/hooks/useAdminUsers';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  LAB_MANAGER: 'Responsable labo',
  PROJECT_MANAGER: 'Chef de projet',
  USER: 'Technicien',
};

const ROLE_OPTIONS = ['USER', 'LAB_MANAGER', 'PROJECT_MANAGER', 'ADMIN'];

function Initials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
      {initials}
    </div>
  );
}

function NoteItem({
  note,
  currentUserId,
  onEdit,
  onDelete,
}: {
  note: { id: string; authorId: string; authorHandle: string; content: string; createdAt: string; updatedAt: string };
  currentUserId: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const isOwn = note.authorId === currentUserId;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {editing ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-gray-600">{note.authorHandle}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">
              {new Date(note.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {note.updatedAt !== note.createdAt && (
              <span className="text-xs text-gray-400 italic">(modifié)</span>
            )}
          </div>
        </div>
        {isOwn && (
          <div className="flex gap-1 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={() => { onEdit(note.id, draft); setEditing(false); }}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => { setDraft(note.content); setEditing(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading } = useAdminUser(id);
  const { data: notes = [] } = useUserNotes(id);
  const { approve, deactivate, reactivate, updateRole } = useUserMutations(id);
  const { add, update, remove } = useNoteMutations(id);

  const [changingRole, setChangingRole] = useState(false);
  const [newNote, setNewNote] = useState('');

  if (isLoading) return <p className="text-sm text-gray-400 p-6">Chargement...</p>;
  if (!user) return <p className="text-sm text-red-500 p-6">Utilisateur introuvable.</p>;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    add.mutate(newNote.trim(), { onSuccess: () => setNewNote('') });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/users')}
        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
      >
        ← Retour à la liste
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-start gap-5">
          <Initials firstName={user.firstName} lastName={user.lastName} />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.contactNumber && <p className="text-sm text-gray-400 mt-0.5">{user.contactNumber}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge status={user.role} label={ROLE_LABELS[user.role] ?? user.role} />
              <Badge status={user.status} />
              <span className="text-xs text-gray-400 self-center">
                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          {/* Status actions */}
          <div className="flex flex-col gap-2 items-end shrink-0">
            {user.status === 'PENDING' && (
              <Button variant="primary" onClick={() => approve.mutate(user.id)}>
                {approve.isPending ? 'En cours...' : 'Approuver'}
              </Button>
            )}
            {user.status === 'ACTIVE' && (
              <Button variant="secondary" onClick={() => deactivate.mutate(user.id)}>
                {deactivate.isPending ? 'En cours...' : 'Désactiver'}
              </Button>
            )}
            {user.status === 'INACTIVE' && (
              <Button variant="secondary" onClick={() => reactivate.mutate(user.id)}>
                {reactivate.isPending ? 'En cours...' : 'Réactiver'}
              </Button>
            )}
          </div>
        </div>

        {/* Priority items */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Éléments prioritaires</p>
          <div className="flex flex-wrap gap-2">
            {user.status === 'PENDING' && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                Approbation requise
              </span>
            )}
            {user.status === 'INACTIVE' && (
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                Compte désactivé
              </span>
            )}
            {user.role === 'ADMIN' && user.status === 'ACTIVE' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                Gestion utilisateurs · Aire 1
              </span>
            )}
            {user.role === 'LAB_MANAGER' && user.status === 'ACTIVE' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                Flux d'approbation · Aire 2
              </span>
            )}
            {user.role === 'PROJECT_MANAGER' && user.status === 'ACTIVE' && (
              <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">
                Cycle projet & rapports · Aire 3
              </span>
            )}
            {user.role === 'USER' && user.status === 'ACTIVE' && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                Saisie des essais · UX terrain
              </span>
            )}
          </div>
        </div>

        {/* Role change */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Modifier le rôle</p>
          {changingRole ? (
            <div className="flex items-center gap-3">
              <select
                defaultValue={user.role}
                onChange={e => {
                  updateRole.mutate({ id: user.id, role: e.target.value });
                  setChangingRole(false);
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                ))}
              </select>
              <button onClick={() => setChangingRole(false)} className="text-sm text-gray-400 hover:text-gray-600">
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setChangingRole(true)}
              className="text-sm text-brand-600 hover:text-brand-800 font-medium"
            >
              Changer le rôle →
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Notes internes</h2>

        {/* Add note */}
        <div className="mb-5">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Ajouter une note, une interprétation ou un commentaire sur cet utilisateur..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              Publié en tant que <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
            </span>
            <Button
              variant="primary"
              onClick={handleAddNote}
              disabled={!newNote.trim() || add.isPending}
            >
              {add.isPending ? 'Envoi...' : 'Ajouter la note'}
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune note pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                currentUserId={currentUser?.id ?? ''}
                onEdit={(noteId, content) => update.mutate({ noteId, content })}
                onDelete={(noteId) => remove.mutate(noteId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
