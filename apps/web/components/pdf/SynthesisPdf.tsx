import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const B = '#0057A8';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';
const GREEN = '#15803d';
const RED = '#b91c1c';
const LIGHT = '#f9fafb';

const s = StyleSheet.create({
  page: { padding: 28, fontFamily: 'Helvetica', fontSize: 9, color: '#111827' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: B, paddingBottom: 10, marginBottom: 14 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: B },
  projectCode: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  desc: { fontSize: 8, color: GRAY, marginTop: 2 },
  dateText: { fontSize: 8, color: GRAY, textAlign: 'right' },
  hrb: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B, textAlign: 'right', marginTop: 3 },

  grid: { flexDirection: 'row', marginBottom: 10 },
  card: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 9 },
  cardL: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 9, marginRight: 8 },
  cardTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lbl: { color: GRAY, flex: 3 },
  val: { fontFamily: 'Helvetica-Bold', textAlign: 'right', flex: 2 },
  valH: { fontFamily: 'Helvetica-Bold', color: B, textAlign: 'right', flex: 2 },
  unit: { color: GRAY, fontFamily: 'Helvetica' },

  compHeader: { flexDirection: 'row', backgroundColor: LIGHT, paddingVertical: 5, paddingHorizontal: 5, borderWidth: 1, borderColor: BORDER },
  compRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 5, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  compSectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER, marginTop: 10 },
  c1: { flex: 3, fontSize: 8 },
  c2: { flex: 2, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  c3: { flex: 3, fontSize: 7.5, color: GRAY },
  c4: { flex: 2, textAlign: 'center', fontSize: 8 },
  ok: { color: GREEN, fontFamily: 'Helvetica-Bold' },
  nok: { color: RED, fontFamily: 'Helvetica-Bold' },
  nd: { color: GRAY },

  note: { fontSize: 7, color: GRAY, marginTop: 6 },
  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 },
  footerText: { fontSize: 7, color: GRAY },
});

function fmt(v?: number | null, dec = 1): string {
  return v != null ? v.toFixed(dec) : '—';
}

function Val({ label, value, unit, hi }: { label: string; value?: number | null; unit?: string; hi?: boolean }) {
  const display = value != null ? `${value.toFixed(label.includes('Gs') || label.includes('DSM') ? 3 : 1)}` : '—';
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={hi ? s.valH : s.val}>
        {display}{value != null && unit ? <Text style={s.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export interface SynthesisData {
  project?: { projectCode?: string; name?: string; description?: string };
  gs?: number | null;
  wnat?: number | null;
  ll?: number | null;
  pl?: number | null;
  ip?: number | null;
  gdmaxTm3?: number | null;
  gdmaxKn?: number | null;
  omc?: number | null;
  proctorMethod?: string | null;
  cbr55?: { cbr25mm?: number | null; cbr50mm?: number | null; cbrIndex?: number | null; swellingReadings?: Array<{ hours: number; swellingPct: number | null }> } | null;
  cbr25?: { cbrIndex?: number | null } | null;
  cbr10?: { cbrIndex?: number | null } | null;
  sieveData: Record<number, number | null>;
  hrb?: string | null;
  today: string;
}

const KEY_SIEVES = [40, 20, 10, 2, 0.5, 0.08];

export default function SynthesisPdf({ data }: { data: SynthesisData }) {
  const { project, gs, wnat, ll, pl, ip, gdmaxTm3, gdmaxKn, omc, proctorMethod, cbr55, cbr25, cbr10, sieveData, hrb, today } = data;

  const swell96 = cbr55?.swellingReadings?.find(r => r.hours === 96)?.swellingPct;
  const pct200 = sieveData[0.08] ?? null;

  const conformRows = [
    { param: '% passant 0.08 mm', value: pct200 != null ? `${pct200.toFixed(1)}%` : '—', spec: '≤ 8%', ok: pct200 != null ? pct200 <= 8 : null },
    { param: 'Indice de plasticité (IP)', value: ip != null ? `${ip.toFixed(1)}%` : '—', spec: '≤ 6% (couche de base)', ok: ip != null ? ip <= 6 : null },
    { param: 'CBR @ 55 coups', value: cbr55?.cbrIndex != null ? `${cbr55.cbrIndex.toFixed(1)}%` : '—', spec: '≥ 80%', ok: cbr55?.cbrIndex != null ? cbr55.cbrIndex >= 80 : null },
    { param: 'DSM Proctor', value: gdmaxTm3 != null ? `${gdmaxTm3.toFixed(3)} T/m³` : '—', spec: '≥ 2.0 T/m³ (GNT dense)', ok: gdmaxTm3 != null ? gdmaxTm3 >= 2.0 : null },
    { param: '% passant 40 mm', value: sieveData[40] != null ? `${sieveData[40]!.toFixed(1)}%` : '—', spec: '95% – 100%', ok: sieveData[40] != null ? sieveData[40]! >= 95 && sieveData[40]! <= 100 : null },
    { param: '% passant 0.5 mm', value: sieveData[0.5] != null ? `${sieveData[0.5]!.toFixed(1)}%` : '—', spec: '5% – 18%', ok: sieveData[0.5] != null ? sieveData[0.5]! >= 5 && sieveData[0.5]! <= 18 : null },
  ];

  return (
    <Document title={`Synthèse — ${project?.projectCode ?? ''}`} author="GeoTech Lab">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Fiche de synthèse géotechnique</Text>
            <Text style={s.projectCode}>{project?.projectCode} — {project?.name}</Text>
            {project?.description ? <Text style={s.desc}>{project.description}</Text> : null}
          </View>
          <View>
            <Text style={s.dateText}>Date : {today}</Text>
            {hrb ? <Text style={s.hrb}>Classification HRB : {hrb}</Text> : null}
          </View>
        </View>

        {/* Row 1 */}
        <View style={s.grid}>
          <View style={s.cardL}>
            <Text style={s.cardTitle}>IDENTIFICATION PHYSIQUE</Text>
            <Val label="Densité relative des grains (Gs)" value={gs} />
            <Val label="Teneur en eau naturelle (Wnat)" value={wnat} unit="%" />
            <Val label="Limite de liquidité (LL)" value={ll} unit="%" hi />
            <Val label="Limite de plasticité (LP)" value={pl} unit="%" />
            <Val label="Indice de plasticité (IP)" value={ip} unit="%" hi />
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>ESSAI PROCTOR (NF P94-093)</Text>
            <View style={s.row}>
              <Text style={s.lbl}>Densité sèche max (DSM)</Text>
              <Text style={s.valH}>{fmt(gdmaxTm3, 3)}{gdmaxTm3 != null ? <Text style={s.unit}> T/m³</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>DSM (kN/m³)</Text>
              <Text style={s.val}>{fmt(gdmaxKn, 2)}{gdmaxKn != null ? <Text style={s.unit}> kN/m³</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>Teneur en eau optimale (OPM)</Text>
              <Text style={s.valH}>{fmt(omc)}{omc != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>Méthode</Text>
              <Text style={s.val}>{proctorMethod === 'MODIFIED' ? 'Modifié' : proctorMethod === 'NORMAL' ? 'Normal' : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Row 2 */}
        <View style={s.grid}>
          <View style={s.cardL}>
            <Text style={s.cardTitle}>ESSAI CBR (NF P94-078)</Text>
            <View style={s.row}>
              <Text style={s.lbl}>CBR @ 55 coups (2.5 mm)</Text>
              <Text style={s.valH}>{fmt(cbr55?.cbr25mm)}{cbr55?.cbr25mm != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>CBR @ 55 coups (5.0 mm)</Text>
              <Text style={s.val}>{fmt(cbr55?.cbr50mm)}{cbr55?.cbr50mm != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>CBR retenu @ 55 coups</Text>
              <Text style={s.valH}>{fmt(cbr55?.cbrIndex)}{cbr55?.cbrIndex != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>CBR @ 25 coups</Text>
              <Text style={s.val}>{fmt(cbr25?.cbrIndex)}{cbr25?.cbrIndex != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>CBR @ 10 coups</Text>
              <Text style={s.val}>{fmt(cbr10?.cbrIndex)}{cbr10?.cbrIndex != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.lbl}>Gonflement max (96h)</Text>
              <Text style={s.val}>{fmt(swell96, 3)}{swell96 != null ? <Text style={s.unit}> %</Text> : null}</Text>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>GRANULOMETRIE (NF P94-056) — % PASSANT</Text>
            {KEY_SIEVES.map(mm => {
              const v = sieveData[mm];
              const hi = [40, 10, 0.08].includes(mm);
              return (
                <View key={mm} style={s.row}>
                  <Text style={s.lbl}>Tamis {mm} mm</Text>
                  <Text style={hi ? s.valH : s.val}>{v != null ? v.toFixed(1) : '—'}{v != null ? <Text style={s.unit}> %</Text> : null}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Compliance table */}
        <Text style={s.compSectionTitle}>VERIFICATION DE CONFORMITE — GNT COUCHE DE BASE</Text>
        <View>
          <View style={s.compHeader}>
            <Text style={[s.c1, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Paramètre</Text>
            <Text style={[s.c2, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Valeur mesurée</Text>
            <Text style={[s.c3, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Exigence CCTP</Text>
            <Text style={[s.c4, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Verdict</Text>
          </View>
          {conformRows.map(row => (
            <View key={row.param} style={s.compRow}>
              <Text style={s.c1}>{row.param}</Text>
              <Text style={s.c2}>{row.value}</Text>
              <Text style={s.c3}>{row.spec}</Text>
              <Text style={[s.c4, row.ok === null ? s.nd : row.ok ? s.ok : s.nok]}>
                {row.ok === null ? 'N/D' : row.ok ? '✓ Conforme' : '✗ Non conforme'}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>* Spécifications selon CCTP type GNT 0/40 pour couche de base routière. Adapter selon le cahier des charges du projet.</Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>GeoTech Lab — {project?.projectCode ?? ''}</Text>
          <Text style={s.footerText}>Fiche de synthèse générée le {today}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
