/** @type {import('tailwindcss').Config} */
// Jetons de design DevLink Africa (DL-07).
//
// Thème sombre façon GitHub, repris le 2026-10-08 à la demande d'Achraf :
// fond quasi noir, un seul accent bleu, plus de terre cuite ni de fond clair.
// Voir docs/DECISIONS.md pour le détail du calcul de chaque teinte.
//
// `ink` est à l'inverse de l'original : 50 est le fond le plus sombre (la
// page), 900 le texte le plus clair. Ce sens compte : partout ailleurs dans
// le code, `bg-ink-50`/`bg-ink-100` désignent un fond et `text-ink-700` à
// `text-ink-900` du texte lisible — en inversant seulement les valeurs ici,
// toutes ces classes redeviennent correctes sans toucher aux composants.
//
// `accent` (bleu) a deux familles distinctes, calculées pour chacune passer
// au moins 4,5:1 :
//   - 50 à 300 : teintes sombres, pour un fond de bouton ou un encadré (texte
//     blanc dessus, contraste vérifié).
//   - 400 à 900 : bleus clairs, pour du texte ou une icône sur fond sombre.
// Les deux familles se chevauchent volontairement : aucune valeur unique ne
// pouvait servir à la fois de fond de bouton (doit rester assez sombre pour
// un texte blanc) et de texte de lien (doit être assez clair sur fond quasi
// noir) — la fenêtre commune où les deux marchent à la fois est trop étroite
// (bien en dessous de 4,5:1 des deux côtés à la fois, vérifié par calcul).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#0a1f33',
          100: '#0d2847',
          200: '#11315c',
          300: '#163f78',
          400: '#1f6feb',
          500: '#388bfd',
          600: '#4493f8',
          700: '#58a6ff',
          800: '#79c0ff',
          900: '#a5d6ff',
        },
        ink: {
          50: '#0d1117',
          100: '#161b22',
          200: '#21262d',
          300: '#30363d',
          400: '#484f58',
          500: '#6e7681',
          600: '#8b949e',
          700: '#adb5bd',
          800: '#c9d1d9',
          900: '#e6edf3',
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
      borderRadius: { card: '1.5rem' },
      boxShadow: {
        // Sur fond sombre, une ombre n'apporte presque rien par elle-même :
        // c'est surtout la bordure (border-ink-200/300) qui sépare les
        // cartes. L'ombre reste discrète, en renfort.
        card: '0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25)',
        // Halo bleu des éléments mis en avant (bouton principal, carte active).
        glow: '0 0 0 1px rgba(56, 139, 253, 0.45), 0 8px 28px -8px rgba(31, 111, 235, 0.7)',
        'glow-soft': '0 0 0 1px rgba(56, 139, 253, 0.2), 0 20px 60px -24px rgba(56, 139, 253, 0.5)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        // Page d'accueil : pastilles qui flottent, halo bleu qui respire.
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
        'bar-fill': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        // Cercles d'échange : un trait lumineux qui parcourt chaque flèche.
        flow: { to: { strokeDashoffset: '-15' } },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 8s ease-in-out infinite',
        'bar-fill': 'bar-fill 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'page-in': 'page-in 350ms ease-out both',
        flow: 'flow 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
