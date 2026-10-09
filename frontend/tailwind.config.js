/** @type {import('tailwindcss').Config} */
// Jetons de design DevLink Africa (DL-07).
//
// Style classique, repris le 2026-10-09 à la demande d'Achraf : fond blanc,
// texte gris foncé, un bleu de lien, des panneaux à bordure fine et des
// boutons à léger dégradé, dans l'esprit de GitHub ou de Bootstrap 3 vers
// 2014. Voir docs/DECISIONS.md.
//
// `ink` est sémantique : 50 est le fond de page, 100 un fond légèrement grisé
// (en-têtes de panneau, pied de page), 200 et 300 les bordures, 500 à 900 du
// texte, du plus discret au plus contrasté. Les composants s'en servent
// partout ; seules les valeurs changent d'un thème à l'autre.
//
// Contrastes sur blanc, vérifiés : ink-500 4,5:1, ink-600 5,7:1, ink-700
// 7,5:1 ; accent-700 (lien) 6,4:1 ; accent-400 porte du blanc à 5,3:1.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f2f7fc',
          100: '#e1edf8',
          200: '#c4dcf0',
          300: '#94bde2',
          400: '#2f6fad',
          500: '#337ab7',
          600: '#2c6aa3',
          700: '#2a6496',
          800: '#23527c',
          900: '#1a3d5c',
        },
        ink: {
          50: '#ffffff',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d0d0d0',
          400: '#a3a3a3',
          500: '#767676',
          600: '#666666',
          700: '#555555',
          800: '#333333',
          900: '#222222',
        },
      },
      fontFamily: {
        // Polices système : aucune dépendance, aucune question de licence.
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Consolas', '"Liberation Mono"', 'Menlo', 'Courier', 'monospace'],
      },
      borderRadius: { card: '4px' },
      boxShadow: {
        card: '0 1px 1px rgba(0, 0, 0, 0.05)',
        raised: '0 1px 3px rgba(0, 0, 0, 0.12)',
        menu: '0 3px 12px rgba(0, 0, 0, 0.15)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
}
