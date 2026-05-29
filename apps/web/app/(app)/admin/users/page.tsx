'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAdminUsers, useUserMutations, AdminUser, RoleFilter } from '@/hooks/useAdminUsers';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  LAB_MANAGER: 'Responsable labo',
  PROJECT_MANAGER: 'Chef de projet',
  USER: 'Technicien',
};

const ROLE_OPTIONS = ['USER', 'LAB_MANAGER', 'PROJECT_MANAGER', 'ADMIN'];

const TABS: { key: RoleFilter; label: string; desc: string }[] = [
  { key: 'ALL',             label: 'Tous',           desc: 'Tous les utilisateurs' },
  { key: 'PENDING',         label: 'En attente',     desc: "Comptes en attente d'approbation" },
  { key: 'ADMIN',           label: 'Admin',          desc: 'Gestion utilisateurs · Aire 1' },
  { key: 'LAB_MANAGER',     label: 'Resp. labo',     desc: "Flux d'approbation · Aire 2" },
  { key: 'PROJECT_MANAGER', label: 'Chef de projet', desc: 'Cycle projet & rapports · Aire 3' },
  { key: 'USER',            label: 'Techniciens',    desc: 'Saisie des essais · UX terrain' },
];

// --- Add User Modal ---
function AddUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => Promise<unknown> }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try { await onCreate(form); onClose(); }
    catch (e: any) { setError(e.message ?? 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Ajouter un utilisateur</h2>
        {[
          { key: 'firstName', label: 'Prénom', type: 'text' },
          { key: 'lastName',  label: 'Nom',    type: 'text' },
          { key: 'email',     label: 'E-mail', type: 'email' },
          { key: 'password',  label: 'Mot de passe', type: 'password' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={set(f.key)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
          <select
            value={form.role}
            onChange={set('role')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Annuler</button>
          <Button variant="primary" onClick={submit} disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Edit User Modal ---
function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (data: any) => Promise<unknown> }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    contactNumber: user.contactNumber ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try { await onSave({ id: user.id, ...form }); onClose(); }
    catch (e: any) { setError(e.message ?? 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Modifier le profil</h2>
        {[
          { key: 'firstName',     label: 'Prénom' },
          { key: 'lastName',      label: 'Nom' },
          { key: 'email',         label: 'E-mail' },
          { key: 'contactNumber', label: 'Téléphone' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type="text"
              value={(form as any)[f.key]}
              onChange={set(f.key)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Annuler</button>
          <Button variant="primary" onClick={submit} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirm Modal ---
function DeleteConfirmModal({ user, onClose, onConfirm }: { user: AdminUser; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Supprimer l'utilisateur</h2>
        <p className="text-sm text-gray-600">
          Supprimer <span className="font-semibold">{user.firstName} {user.lastName}</span> ({user.email}) ?
        </p>
        <p className="text-xs text-red-500">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Annuler</button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); }}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main page ---
export default function AdminUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useAdminUsers(activeTab);
  const { approve, deactivate, reactivate, updateRole, createUser, updateProfile, deleteUser: deleteMutation } = useUserMutations();

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
  });

  const activeTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeTabMeta.desc}</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>+ Ajouter</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher par nom ou e-mail..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                  </td>

                  {/* Role — click to change inline */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {changingRole === user.id ? (
                      <select
                        autoFocus
                        defaultValue={user.role}
                        onBlur={() => setChangingRole(null)}
                        onChange={e => { updateRole.mutate({ id: user.id, role: e.target.value }); setChangingRole(null); }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                      >
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setChangingRole(user.id)} title="Cliquer pour changer le rôle" className="hover:opacity-70 transition-opacity">
                        <Badge status={user.role} label={ROLE_LABELS[user.role] ?? user.role} />
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3"><Badge status={user.status} /></td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {/* Status transitions */}
                      {user.status === 'PENDING' && (
                        <button onClick={() => approve.mutate(user.id)}
                          className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 font-medium">
                          Approuver
                        </button>
                      )}
                      {user.status === 'ACTIVE' && (
                        <button onClick={() => deactivate.mutate(user.id)}
                          className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
                          Désactiver
                        </button>
                      )}
                      {user.status === 'INACTIVE' && (
                        <button onClick={() => reactivate.mutate(user.id)}
                          className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium">
                          Réactiver
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => setEditUser(user)}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                        title="Modifier le profil"
                      >
                        Modifier
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteUser(user)}
                        className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                        title="Supprimer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreate={data => createUser.mutateAsync(data)}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={data => updateProfile.mutateAsync(data)}
        />
      )}
      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => deleteMutation.mutateAsync(deleteUser.id).then(() => setDeleteUser(null))}
        />
      )}
    </div>
  );
}
