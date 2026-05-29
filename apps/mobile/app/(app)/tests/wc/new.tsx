import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface DeterminationRow {
  massContainerG: string;
  massContainerWetSoilG: string;
  massContainerDrySoilG: string;
}

function calcWc(row: DeterminationRow): number | null {
  const c = parseFloat(row.massContainerG);
  const w = parseFloat(row.massContainerWetSoilG);
  const d = parseFloat(row.massContainerDrySoilG);
  if (isNaN(c) || isNaN(w) || isNaN(d)) return null;
  const mw = w - d;
  const md = d - c;
  if (md <= 0) return null;
  return (mw / md) * 100;
}

function emptyRow(): DeterminationRow {
  return { massContainerG: '', massContainerWetSoilG: '', massContainerDrySoilG: '' };
}

export default function NewWcTestScreen() {
  const [rows, setRows] = useState<DeterminationRow[]>([emptyRow()]);
  const [temperatureC, setTemperatureC] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function updateRow(i: number, field: keyof DeterminationRow, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  const wcValues = rows.map(calcWc).filter((v): v is number => v !== null);
  const avgWc = wcValues.length > 0 ? wcValues.reduce((a, b) => a + b, 0) / wcValues.length : null;

  async function handleSubmit() {
    const validDets = rows
      .map(r => ({
        massContainerG: parseFloat(r.massContainerG),
        massContainerWetSoilG: parseFloat(r.massContainerWetSoilG),
        massContainerDrySoilG: parseFloat(r.massContainerDrySoilG),
      }))
      .filter(d => !isNaN(d.massContainerG) && !isNaN(d.massContainerWetSoilG) && !isNaN(d.massContainerDrySoilG));

    if (validDets.length === 0) {
      Alert.alert('Erreur', 'Au moins une détermination valide est requise.');
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/tests/water-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          temperatureC: temperatureC ? parseFloat(temperatureC) : undefined,
          notes: notes || undefined,
          determinations: validDets,
        }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      Alert.alert('Succès', 'Essai enregistré avec succès.');
      setRows([emptyRow()]);
      setTemperatureC('');
      setNotes('');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer l'essai. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.sectionTitle}>Informations générales</Text>

      <View style={s.field}>
        <Text style={s.label}>Température (°C)</Text>
        <TextInput style={s.input} value={temperatureC} onChangeText={setTemperatureC} keyboardType="decimal-pad" placeholder="ex: 22.5" placeholderTextColor="#9CA3AF" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Notes</Text>
        <TextInput style={[s.input, { height: 72 }]} value={notes} onChangeText={setNotes} multiline placeholder="Observations..." placeholderTextColor="#9CA3AF" />
      </View>

      <Text style={s.sectionTitle}>Déterminations</Text>

      {rows.map((row, i) => {
        const wc = calcWc(row);
        return (
          <View key={i} style={s.det}>
            <Text style={s.detTitle}>Détermination #{i + 1}{wc !== null ? `  →  w = ${wc.toFixed(1)}%` : ''}</Text>
            {([
              ['massContainerG', 'Masse conteneur (g)'],
              ['massContainerWetSoilG', 'Masse cont. + sol humide (g)'],
              ['massContainerDrySoilG', 'Masse cont. + sol sec (g)'],
            ] as const).map(([field, lbl]) => (
              <View key={field} style={s.field}>
                <Text style={s.label}>{lbl}</Text>
                <TextInput
                  style={s.input}
                  value={row[field]}
                  onChangeText={v => updateRow(i, field, v)}
                  keyboardType="decimal-pad"
                  placeholder="0.000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ))}
          </View>
        );
      })}

      <TouchableOpacity style={s.addBtn} onPress={addRow}>
        <Text style={s.addBtnText}>+ Ajouter une détermination</Text>
      </TouchableOpacity>

      {avgWc !== null && (
        <View style={s.avgBox}>
          <Text style={s.avgLabel}>Teneur en eau moyenne</Text>
          <Text style={s.avgValue}>{avgWc.toFixed(3)}%</Text>
        </View>
      )}

      <TouchableOpacity style={s.submit} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Enregistrer le test</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#102A43', marginTop: 16, marginBottom: 8 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827' },
  det: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 12 },
  detTitle: { fontSize: 13, fontWeight: '700', color: '#0F62FE', marginBottom: 10 },
  addBtn: { paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#0F62FE', fontSize: 14, fontWeight: '600' },
  avgBox: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 16, marginVertical: 16, alignItems: 'center' },
  avgLabel: { fontSize: 13, color: '#3B82F6', marginBottom: 4 },
  avgValue: { fontSize: 32, fontWeight: '800', color: '#1D4ED8' },
  submit: { backgroundColor: '#0F62FE', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
