'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/useClients';

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1c2333', margin: 0 }}>Mes Clients</h1>
        <Link href="/clients/new">
          <button style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nouveau client
          </button>
        </Link>
      </div>

      <input
        type="text"
        placeholder="Rechercher un client..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 360, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 20, outline: 'none', fontFamily: 'inherit' }}
      />

      {isLoading ? (
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun client enregistré. Créez votre premier client.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => router.push(`/clients/${c.id}`)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1c2333' }}>{c.name}</div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                  background: c.type === 'BUSINESS' ? '#dbeafe' : '#ede9fe',
                  color: c.type === 'BUSINESS' ? '#1e40af' : '#5b21b6',
                }}>
                  {c.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
                </span>
              </div>
              {c.contactName && <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{c.contactName}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {c.email && <span>{c.email}</span>}
                {c.phone && <span>{c.phone}</span>}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                {c.projectCount} projet{c.projectCount !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
