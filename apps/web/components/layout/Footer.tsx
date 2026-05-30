export default function AppFooter() {
  return (
    <footer style={{
      height: 24,
      minHeight: 24,
      background: '#1c2333',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, color: '#64748b' }}>Workflow Essais</span>
      <span style={{ fontSize: 10, color: '#4a6080', marginLeft: 'auto' }}>GeoTech Lab v2.1.0</span>
    </footer>
  );
}
