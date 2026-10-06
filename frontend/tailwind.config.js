/** @type {import('tailwindcss').Config} */
// Jetons de design DevLink Africa (DL-07).
// Parti pris : un seul accent (terracotta), des gris chauds, beaucoup d'espace.
// Tous les contrastes texte/fond visés sont au moins AA (4,5:1).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Accent unique : terre cuite. 600 sur blanc = 4,8:1.
        accent: {
          50: '#fdf4f1',
          100: '#fae5dd',
          200: '#f4c7b8',
          300: '#eba288',
          400: '#df7753',
          500: '#d0552c',
          600: '#b24422',
          700: '#8f371e',
          800: '#6f2d1a',
          900: '#4f2214',
        },
        // Gris chauds, pour éviter le bleu froid des modèles génériques.
        ink: {
          50: '#faf9f7',
          100: '#f2f0ec',
          200: '#e4e0d9',
          300: '#cdc7bc',
          400: '#a39b8d',
          500: '#7c7467',
          600: '#5d564b',
          700: '#453f37',
          800: '#2d2925',
          900: '#1a1815',
        },
      },
      fontFamily: {
        // Polices système : aucune dépendance, aucune question de licence.
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { card: '0.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(26, 24, 21, 0.06), 0 4px 12px rgba(26, 24, 21, 0.04)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { 'fade-in': 'fade-in 150ms ease-out' },
    },
  },
  plugins: [],
}
