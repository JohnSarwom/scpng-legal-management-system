import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#111827', 700: '#1F2937', 500: '#4B5563' },
        paper: '#F8F8FA',
        surface: '#FFFFFF',
        line: '#E6E0E3',
        muted: '#667085',
        maroon: { 950: '#35000B', 900: '#510015', 800: '#780024', 700: '#98002E', 100: '#F8EEF1' },
        cases: '#2563A8',
        docs: '#6D54B5',
        corr: '#D9682A',
        entity: '#2E9E6B',
        success: '#2E9E6B',
        warning: '#C9881F',
        danger: '#C0392B',
        confidential: '#8A1C2B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 30px rgba(31, 14, 21, 0.09)',
        lift: '0 18px 40px rgba(81, 0, 21, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
