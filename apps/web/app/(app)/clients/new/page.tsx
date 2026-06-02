'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateClient } from '@/hooks/useClients';

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();
  const [form, setForm] = useState({ name: '', type: 'PERSON', contactName: '', email: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await createClient.mutateAsync(form as any);
      const clientId = (result as any).data?.id;
      router.push(clientId ? `/clients/${clientId}` : '/clients');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création');
    }
  }

  const inputStyle = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 4 };

  return (
    <div style={{ padding: 24, maxWidth: 540 }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 12, color: '#94a3b8', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          ← Retour
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1c2333', margin: '8px 0 0' }}>Nouveau client</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom *</label>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Nom du client ou de l'entreprise" />
        </div>

        <div>
          <label style={labelStyle}>Type</label>
          <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="PERSON">Particulier</option>
            <option value="BUSINESS">Entreprise</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Personne de contact</label>
          <input style={inputStyle} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Nom du contact principal" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@exemple.com" />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 514 000 0000" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Adresse</label>
          <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Adresse complète" />
        </div>

        <div>
          <label style={labelStyle}>Notes internes</label>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes ou remarques..." />
        </div>

        {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={() => router.back()} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>
            Annuler
          </button>
          <button type="submit" disabled={createClient.isPending} style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {createClient.isPending ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}
