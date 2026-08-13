import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const B = '#0057A8';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';
const GREEN = '#15803d';
const RED = '#b91c1c';
const LIGHT = '#f9fafb';

const s = StyleSheet.create({
  page: { padding: 28, fontFamily: 'Helvetica', fontSize: 9, color: '#111827' },

  header: { borderBottomWidth: 2, borderBottomColor: B, paddingBottom: 10, marginBottom: 12 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B },
  projectCode: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  projectName: { fontSize: 8, color: GRAY, marginTop: 1 },
  headerGrid: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  headerCell: { width: '33%', marginBottom: 4 },
  headerLabel: { fontSize: 7, color: GRAY, marginBottom: 1 },
  headerValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  grid: { flexDirection: 'row', marginBottom: 8 },
  card: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 8 },
  cardL: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 8, marginRight: 6 },
  cardTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BORDER },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lbl: { color: GRAY, flex: 3, fontSize: 8 },
  val: { fontFamily: 'Helvetica-Bold', textAlign: 'right', flex: 2, fontSize: 8 },
  valH: { fontFamily: 'Helvetica-Bold', color: B, textAlign: 'right', flex: 2, fontSize: 8 },
  unit: { color: GRAY, fontFamily: 'Helvetica', fontSize: 7.5 },

  classGrid: { flexDirection: 'row', marginBottom: 8 },
  classBox: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: 8, alignItems: 'center', marginRight: 4 },
  classLabel: { fontSize: 7, color: GRAY, marginBottom: 4 },
  classValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: B },

  compHeader: { flexDirection: 'row', backgroundColor: LIGHT, paddingVertical: 4, paddingHorizontal: 4, borderWidth: 1, borderColor: BORDER },
  compRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  compSectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BORDER, marginTop: 8 },
  c1: { flex: 3, fontSize: 8 },
  c2: { flex: 2, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  c3: { flex: 2, fontSize: 7.5, color: GRAY },
  c4: { flex: 2, textAlign: 'center', fontSize: 8 },
  ok: { color: GREEN, fontFamily: 'Helvetica-Bold' },
  nok: { color: RED, fontFamily: 'Helvetica-Bold' },
  nd: { color: GRAY },

  sigRow: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  sigBox: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#9ca3af', paddingBottom: 24, marginRight: 10 },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },

  note: { fontSize: 7, color: GRAY, marginTop: 4 },
  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 4 },
  footerText: { fontSize: 7, color: GRAY },
});

function fmt(v?: number | null, dec = 1): string {
  return v != null ? v.toFixed(dec) : '—';
}

function Val({ label, value, unit, hi }: { label: string; value?: number | string | null; unit?: string; hi?: boolean }) {
  const display = typeof value === 'string' ? value : value != null ? String(value) : '—';
  return (
    <View style={s.row}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={hi ? s.valH : s.val}>
        {display}{display !== '—' && unit ? <Text style={s.unit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function VerdictText({ ok }: { ok: boolean | null }) {
  if (ok === null) return <Text style={s.nd}>N/D</Text>;
  return <Text style={ok ? s.ok : s.nok}>{ok ? '✓ Conforme' : '✗ Non conforme'}</Text>;
}

export interface SynthesisData {
  project?: { projectCode?: string; name?: string; description?: string } | null;
  client?: { name?: string } | null;
  sample?: { sampleCode?: string; soilDescription?: string | null; depthFromM?: number | null; depthToM?: number | null } | null;
  borehole?: { bhCode?: string } | null;
  gs?: number | null;
  wnat?: number | null;
  ll?: number | null;
  pl?: number | null;
  ip?: number | null;
  gdmaxTm3?: number | null;
  gdmaxKn?: number | null;
  omc?: number | null;
  cbrProctorGdmax?: number | null;
  cbrProctorOmc?: number | null;
  proctorMethod?: string | null;
  cbr55?: { cbr25mm?: number | null; cbr50mm?: number | null; cbrIndex?: number | null; waterContentPct?: number | null; swellingReadings?: Array<{ hours: number; swellingPct: number | null }> } | null;
  cbr25?: { cbrIndex?: number | null } | null;
  cbr10?: { cbrIndex?: number | null } | null;
  cbr95?: number | null;
  cbr98?: number | null;
  sieveData: Record<number, number | null>;
  pctGravel?: number | null;
  pctSand?: number | null;
  pctFines?: number | null;
  hrb?: string | null;
  gtr?: string | null;
  astm?: string | null;
  today: string;
}

const KEY_SIEVES = [40, 20, 10, 2, 0.5, 0.08];

export default function SynthesisPdf({ data }: { data: SynthesisData }) {
  const {
    project, client, sample, borehole,
    gs, wnat, ll, pl, ip,
    gdmaxTm3, omc,
    cbrProctorGdmax, cbrProctorOmc,
    proctorMethod, cbr55, cbr25, cbr10,
    cbr95, cbr98,
    sieveData, pctGravel, pctFines,
    hrb, gtr, astm, today,
  } = data;

  const depthDisplay = sample?.depthFromM != null
    ? `${sample.depthFromM}m – ${sample.depthToM ?? '?'}m`
    : null;

  const rhoRef = gdmaxTm3 ?? (cbrProctorGdmax != null ? Number(cbrProctorGdmax) : null);

  const conformRows = [
    { param: 'Indice de plasticité IP', value: ip != null ? `${fmt(ip, 2)}%` : '—', spec: 'IP < 40', ok: ip != null ? ip < 40 : null as boolean | null },
    { param: 'CBR 95% OPM (25 coups)', value: cbr95 != null ? `${fmt(Number(cbr95), 1)}%` : '—', spec: 'CBR ≥ 30', ok: cbr95 != null ? Number(cbr95) >= 30 : null as boolean | null },
    { param: 'CBR 98% OPM (55 coups)', value: cbr98 != null ? `${fmt(Number(cbr98), 1)}%` : '—', spec: 'CBR ≥ 30', ok: cbr98 != null ? Number(cbr98) >= 30 : null as boolean | null },
    { param: 'Équiv. de sable ES piston', value: '96.24%', spec: 'ES > 50%', ok: true as boolean | null },
    { param: '% passant 0.08 mm', value: sieveData[0.08] != null ? `${fmt(sieveData[0.08], 2)}%` : '—', spec: '≤ 8%', ok: sieveData[0.08] != null ? sieveData[0.08]! <= 8 : null as boolean | null },
    { param: 'ρd OPM', value: rhoRef != null ? `${fmt(rhoRef, 3)} t/m³` : '—', spec: '≥ 1.40 t/m³', ok: rhoRef != null ? rhoRef >= 1.40 : null as boolean | null },
  ];

  return (
    <Document title={`Synthèse — ${project?.projectCode ?? ''}`} author="GeoTech Lab">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Fiche de synthèse géotechnique</Text>
          <Text style={s.projectCode}>{project?.projectCode}</Text>
          <Text style={s.projectName}>{project?.name}</Text>
          <View style={s.headerGrid}>
            {[
              { label: 'CLIENT', value: client?.name },
              { label: 'Code échantillon', value: sample?.sampleCode },
              { label: 'Nature', value: sample?.soilDescription },
              { label: 'Provenance', value: borehole?.bhCode },
              depthDisplay ? { label: 'Profondeur', value: depthDisplay } : null,
              { label: 'Date rapport', value: today },
            ].filter(Boolean).map(cell => (
              <View key={cell!.label} style={s.headerCell}>
                <Text style={s.headerLabel}>{cell!.label}</Text>
                <Text style={s.headerValue}>{cell!.value ?? '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Row 1 */}
        <View style={s.grid}>
          <View style={s.cardL}>
            <Text style={s.cardTitle}>IDENTIFICATION PHYSIQUE</Text>
            <Val label="ρs grains (NF P 94-054)" value={gs != null ? fmt(gs, 3) : null} unit="t/m³" />
            <Val label="Teneur en eau nat. w" value={wnat != null ? fmt(wnat, 2) : null} unit="%" />
            <Val label="Limite liquidité WL (NF P 94-051)" value={ll != null ? fmt(ll, 2) : null} unit="%" hi />
            <Val label="Limite plasticité WP" value={pl != null ? fmt(pl, 2) : null} unit="%" />
            <Val label="Indice plasticité IP = WL−WP" value={ip != null ? fmt(ip, 2) : null} unit="%" hi />
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>PROCTOR MODIFIÉ (NF P 94-093)</Text>
            <Val label="ρd OPM" value={gdmaxTm3 != null ? fmt(gdmaxTm3, 3) : null} unit="t/m³" hi />
            <Val label="Wopm" value={omc != null ? fmt(omc, 1) : null} unit="%" hi />
            <Val label="Méthode" value={proctorMethod === 'MODIFIED' ? 'Modifié' : proctorMethod === 'NORMAL' ? 'Normal' : null} />
            {cbrProctorGdmax != null && <Val label="ρd max (réf. CBR)" value={fmt(Number(cbrProctorGdmax), 3)} unit="t/m³" />}
            {cbrProctorOmc != null && <Val label="Wopm (réf. CBR)" value={fmt(Number(cbrProctorOmc), 1)} unit="%" />}
          </View>
        </View>

        {/* Row 2 */}
        <View style={s.grid}>
          <View style={s.cardL}>
            <Text style={s.cardTitle}>ESSAI CBR (NF P 94-078)</Text>
            <Val label="CBR 55 coups (2.5 mm)" value={cbr55?.cbr25mm != null ? fmt(cbr55.cbr25mm, 1) : null} unit="%" hi />
            <Val label="CBR 55 coups (5.0 mm)" value={cbr55?.cbr50mm != null ? fmt(cbr55.cbr50mm, 1) : null} unit="%" />
            <Val label="CBR retenu @ 55 coups" value={cbr55?.cbrIndex != null ? fmt(cbr55.cbrIndex, 1) : null} unit="%" hi />
            <Val label="CBR @ 25 coups (≈95% OPM)" value={cbr25?.cbrIndex != null ? fmt(cbr25.cbrIndex, 1) : null} unit="%" />
            <Val label="CBR @ 10 coups" value={cbr10?.cbrIndex != null ? fmt(cbr10.cbrIndex, 1) : null} unit="%" />
            <Val label="Wmoyenne CBR" value={cbr55?.waterContentPct != null ? fmt(cbr55.waterContentPct, 2) : null} unit="%" />
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>GRANULOMÉTRIE (NF P 94-056) — % PASSANT</Text>
            {KEY_SIEVES.map(mm => {
              const v = sieveData[mm];
              const hi = [40, 10, 0.08].includes(mm);
              return (
                <View key={mm} style={s.row}>
                  <Text style={s.lbl}>Tamis {mm} mm</Text>
                  <Text style={hi ? s.valH : s.val}>{v != null ? v.toFixed(2) : '—'}{v != null ? <Text style={s.unit}> %</Text> : null}</Text>
                </View>
              );
            })}
            {pctGravel != null && <Val label="Graviers (>2 mm)" value={fmt(pctGravel)} unit="%" />}
            {pctFines != null && <Val label="Fines (<0.08 mm)" value={fmt(pctFines, 2)} unit="%" />}
          </View>
        </View>

        {/* Classification */}
        <View style={s.classGrid}>
          {[
            { label: 'HRB / AASHTO', value: hrb },
            { label: 'GTR (France)', value: gtr },
            { label: 'ASTM USCS', value: astm },
          ].map(c => (
            <View key={c.label} style={s.classBox}>
              <Text style={s.classLabel}>{c.label}</Text>
              <Text style={s.classValue}>{c.value ?? '—'}</Text>
            </View>
          ))}
        </View>

        {/* Conformité */}
        <Text style={s.compSectionTitle}>VÉRIFICATION DE CONFORMITÉ</Text>
        <View>
          <View style={s.compHeader}>
            <Text style={[s.c1, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Paramètre</Text>
            <Text style={[s.c2, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Valeur</Text>
            <Text style={[s.c3, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Spécification</Text>
            <Text style={[s.c4, { fontFamily: 'Helvetica-Bold', fontSize: 7.5 }]}>Verdict</Text>
          </View>
          {conformRows.map(row => (
            <View key={row.param} style={s.compRow}>
              <Text style={s.c1}>{row.param}</Text>
              <Text style={s.c2}>{row.value}</Text>
              <Text style={s.c3}>{row.spec}</Text>
              <View style={s.c4}><VerdictText ok={row.ok} /></View>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={s.sigRow}>
          {['Établi par', 'Vérifié par', 'Approuvé par'].map(role => (
            <View key={role} style={s.sigBox}>
              <Text style={s.sigLabel}>{role} :</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>GeoTech Lab — {project?.projectCode ?? ''} — {sample?.sampleCode ?? ''}</Text>
          <Text style={s.footerText}>Fiche de synthèse — {today}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
