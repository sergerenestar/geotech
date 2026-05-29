'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import WcDeterminationTable from '@/components/tests/WcDeterminationTable';
import { useCreateWcTest, WcDeterminationInput } from '@/hooks/useWcTests';

export default function NewWcTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreateWcTest();

  const [temperatureC, setTemperatureC] = useState('');
  const [notes, setNotes] = useState('');
  const [determinations, setDeterminations] = useState<WcDeterminationInput[]>([]);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (determinations.length === 0) {
      setError('Au moins une détermination valide est requise.');
      return;
    }
    try {
      const test = await createTest.mutateAsync({
        projectId,
        temperatureC: temperatureC ? parseFloat(temperatureC) : undefined,
        notes: notes || undefined,
        determinations,
      });
      router.push(`/projects/${projectId}/tests/water-content/${test.id}`);
    } catch {
      setError('Erreur lors de la création du test. Veuillez réessayer.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Teneur en eau (D-2216)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Température (°C)"
              type="number"
              step="0.1"
              value={temperatureC}
              onChange={e => setTemperatureC(e.target.value)}
              placeholder="ex: 22.5"
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Observations, conditions particulières..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Déterminations</h2>
          <p className="text-sm text-gray-500">Saisir les masses mesurées — les calculs D-2216 sont effectués automatiquement.</p>
          <WcDeterminationTable onChange={setDeterminations} />
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={createTest.isPending}>
            {createTest.isPending ? 'Enregistrement...' : 'Enregistrer le test'}
          </Button>
        </div>
      </form>
    </div>
  );
}
