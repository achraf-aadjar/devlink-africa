/** @type {import('tailwindcss').Config} */
// Jetons de design DevLink Africa : « la feuille de match ».
//
// Un tableau tactique émaillé (fond chaud presque blanc), des feuilles
// blanches posées dessus, de l'encre noire, un bleu d'action et un orange
// pour la demande, comme les deux couleurs d'aimants d'un entraîneur.
// Clair par défaut, ardoise quand l'appareil est en mode sombre. Les valeurs
// vivent en variables CSS dans index.css ; ce fichier ne garde que les noms.
//
// `ink` : 50 est le fond de la page (le tableau), 100 la feuille (cartes,
// champs, fenêtres), 900 le texte le plus contrasté. Le sens est le même dans
// les deux thèmes, donc `bg-ink-100` ou `text-ink-700` marchent partout.
//
// `accent` (bleu) a deux familles : 50 à 200 pour un fond teinté, 300 à 900
// pour un aplat, une icône ou du texte. Chaque teinte de texte tient 4,5:1
// sur le tableau et sur la feuille, dans son thème.
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
        // Bleu des actions et de l'offre (« Je sais faire ») : blanc dessus à
        // 7,2:1 en clair, 5,5:1 en sombre.
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          hover: 'rgb(var(--brand-hover) / <alpha-value>)',
        },
        // Orange de la demande (« Je veux apprendre ») : `demand` pour un
        // texte, `demand-fill` pour un aimant ou une barre (blanc dessus 4,8:1).
        demand: {
          DEFAULT: 'rgb(var(--demand) / <alpha-value>)',
          fill: '#c24d12',
        },
        // Barre d'en-tête et plaques de score : le noir du tableau d'affichage.
        bar: {
          DEFAULT: 'rgb(var(--bar) / <alpha-value>)',
          text: '#e9eae6',
          muted: '#b3b6bb',
          line: 'rgb(255 255 255 / 0.14)',
          accent: '#8fb1ff',
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
        // Voile : encre en thème clair, blanc en thème sombre. Pour les
        // liserés et les fonds translucides qui doivent marcher dans les deux.
        veil: 'rgb(var(--veil) / <alpha-value>)',
        // États : valeurs claires ou sombres selon le thème (index.css).
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          // Aplat d'un bouton destructif, texte blanc à 6,6:1.
          solid: '#b42318',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        // Fira Sans (SIL OFL 1.1, voir LICENSES.md), hébergée avec le site et
        // réduite aux caractères utiles, dont le latin africain (ɛ, ɔ, ŋ, ɓ,
        // ɗ, ƙ, ƴ, ẹ, ọ, ṣ…). Les polices système prennent le relais pour le
        // reste.
        sans: [
          '"Fira Sans"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
        // Capitales et chiffres de la feuille de match : titres, noms, scores.
        display: ['"Fira Sans Extra Condensed"', '"Fira Sans"', 'Arial Narrow', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { card: '0.5rem' },
      boxShadow: {
        // Feuille posée sur le tableau : ombre courte et décalée vers le bas.
        sheet: '0 1px 0 rgb(var(--veil) / 0.06), 0 2px 6px -2px rgb(var(--veil) / 0.12)',
        // Fenêtre au-dessus de la page.
        lift: '0 12px 32px -12px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.12)',
        // Aimant : un petit relief, comme un disque posé sur le tableau.
        magnet: 'inset 0 -2px 0 rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        // Flèche au feutre qui se trace une fois.
        draw: { from: { strokeDashoffset: 'var(--len, 400)' }, to: { strokeDashoffset: '0' } },
        'bar-fill': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        draw: 'draw 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'bar-fill': 'bar-fill 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
