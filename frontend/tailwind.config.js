/** @type {import('tailwindcss').Config} */
// Jetons de design DevLink Africa (DL-07).
//
// Thème façon GitHub, un seul accent bleu. Clair par défaut, sombre quand
// l'appareil est en mode sombre (`prefers-color-scheme`). Les valeurs des
// échelles `ink`, `accent` et `veil` vivent en variables CSS dans index.css ;
// ce fichier ne garde que les noms. Voir docs/DECISIONS.md pour le calcul des
// teintes sombres.
//
// `ink` est à l'inverse de l'original : 50 est le fond de la page, 900 le
// texte le plus contrasté (le plus clair en sombre, le plus foncé en clair). Ce sens compte : partout ailleurs dans
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
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
        },
        // Bleu des actions (bouton, pastille) : blanc dessus à 4,6:1.
        brand: { DEFAULT: '#1f6feb', hover: '#1a5fd0' },
        // Second ton des dégradés et des halos.
        violet: '#a371f7',
        // Pastille claire de l'en-tête, posée sur le fond sombre.
        paper: {
          DEFAULT: '#f0f2f5',
          hover: '#e3e6eb',
          active: '#dde1e7',
          line: '#d0d7de',
          text: '#3d444d',
          ink: '#0d1117',
          brand: '#0969da',
        },
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        // Voile : blanc en thème sombre, encre en thème clair. Remplace
        // `white/xx` pour les fonds et liserés translucides.
        veil: 'rgb(var(--veil) / <alpha-value>)',
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
