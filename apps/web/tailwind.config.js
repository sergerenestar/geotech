/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          from: '#2EC5FF',
          via: '#4F7DF3',
          to: '#A78BFA',
        },
        sidebar: '#102A43',
        surface: '#FFFFFF',
        background: '#f4f5f7',
        topbar: '#1c2333',
        'icon-rail': '#1e2a3a',
        accent: '#0e7490',
        'accent-hover': '#0c6880',
        status: {
          draft: { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
          active: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
          onhold: { bg: '#FEF9C3', text: '#713F12', border: '#FDE047' },
          completed: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
          archived: { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' },
          cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
          pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        card: '12px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2EC5FF 0%, #4F7DF3 50%, #A78BFA 100%)',
      },
    },
  },
  plugins: [],
};
