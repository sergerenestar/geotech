'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import WcDeterminationTable from '@/components/tests/WcDeterminationTable';
import { useWcTest, useUpdateWcTest, WcDeterminationInput } from '@/hooks/useWcTests';

export default function EditWcTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useWcTest(testId);
  const updateTest = useUpdateWcTest();

  const [temperatureC, setTemperatureC] = useState('');
  const [notes, setNotes] = useState('');
  const [determinations, setDeterminations] = useState<WcDeterminationInput[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setTemperatureC(test.temperatureC != null ? String(test.temperatureC) : '');
      setNotes(test.notes ?? '');
      setDeterminations(test.determinations.map(d => ({
        massContainerG: d.massContainerG,
        massContainerWetSoilG: d.massContainerWetSoilG,
        massContainerDrySoilG: d.massContainerDrySoilG,
      })));
      setReady(true);
    }
  }, [test, ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (determinations.length === 0) {
      setError('Au moins une détermination valide est requise.');
      return;
    }
    try {
      await updateTest.mutateAsync({
        testId,
        payload: {
          projectId,
          temperatureC: temperatureC ? parseFloat(temperatureC) : undefined,
          notes: notes || undefined,
          determinations,
        },
      });
      router.push(`/projects/${projectId}/tests/water-content/${testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Teneur en eau (D-2216)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Température (°C)" type="number" step="0.1"
              value={temperatureC} onChange={e => setTemperatureC(e.target.value)} />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Déterminations</h2>
          <WcDeterminationTable
            onChange={setDeterminations}
            initialRows={determinations}
          />
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={updateTest.isPending}>
            {updateTest.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
