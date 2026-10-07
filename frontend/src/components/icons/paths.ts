/**
 * Tracés des icônes de DevLink Africa.
 *
 * Toutes dessinées sur la même grille de 24 unités, avec les mêmes règles :
 * trait de 1,75 unité, extrémités et jonctions arrondies, aucun remplissage.
 * Cette discipline est ce qui fait qu'un jeu d'icônes paraît cohérent : c'est la
 * régularité du trait et de la marge, pas le talent de chaque dessin.
 *
 * Marge optique : les formes tiennent dans un carré de 20 unités centré, ce qui
 * laisse 2 unités de respiration sur chaque bord. Les icônes posées côte à côte
 * semblent donc de même poids, même quand leurs formes diffèrent.
 *
 * Écrites à la main : aucune bibliothèque d'icônes, donc aucune licence tierce
 * à déclarer (voir LICENSES.md).
 *
 * Fichier séparé du composant : un module qui exporte autre chose que des
 * composants casse le rechargement à chaud de Vite.
 */

export const PATHS = {
  // --- Navigation ---------------------------------------------------------
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  profile: 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M15.2 15.2 20 20',
  // Carte : trois plis verticaux, la forme universelle d'une carte dépliée.
  map: 'M4 6.5 9.5 4.5v13L4 19.5zM9.5 4.5 14.5 6.5v13L9.5 17.5M14.5 6.5 20 4.5v13L14.5 19.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  chevronRight: 'M10 7l5 5-5 5',
  chevronDown: 'M7 10l5 5 5-5',
  logout: 'M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M15 8l4 4-4 4M19 12H9',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 1 1 4 0v.6a1.6 1.6 0 0 0 2.5 1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1 2.5H21a2 2 0 1 1 0 4h-.6a1.6 1.6 0 0 0-1 .9',

  // --- Le produit ---------------------------------------------------------
  // Compétence : un losange, forme qui évoque la pierre taillée, le savoir-faire.
  skill: 'M12 3.5 20.5 12 12 20.5 3.5 12z',
  // Match : deux cercles qui se recouvrent, et leur intersection marquée.
  // Troisième essai : les métaphores de puzzle et d'emboîtement devenaient
  // illisibles à 20 px. Deux cercles qui se croisent disent « ces deux-là se
  // rejoignent » sans aucune ambiguïté, à toutes les tailles.
  match: 'M9.5 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12M14.5 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12',
  // Échange : deux flèches qui circulent en sens inverse.
  exchange: 'M4 9h13l-3.5-3.5M20 15H7l3.5 3.5',
  project: 'M4 8a2 2 0 0 1 2-2h3l1.5 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  // Preuve : une coche inscrite dans un écu, l'idée de garantie.
  proof: 'M12 3.5 19 6v6c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5V6zM9 12l2.2 2.2L15.5 10',
  country:
    'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M3.5 12h17M12 3.5c2.2 2.3 3.4 5.4 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.4-3.4-8.5S9.8 5.8 12 3.5',

  // --- Les types d'échange ------------------------------------------------
  // Mentorat : une personne qui en guide une autre, la seconde plus petite.
  mentoring:
    'M8 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M3.5 19c0-2.6 2-4.3 4.5-4.3s4.5 1.7 4.5 4.3M16.5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4M14 19c0-2 1.1-3.3 2.5-3.3S19 17 19 19',
  // Revue de code : les chevrons du code, et une coche franchement détachée
  // en bas à droite. L'écart entre les deux évite toute confusion de lecture.
  codeReview: 'M8 5.5 4 9.5 8 13.5M13.5 5.5 17.5 9.5 13.5 13.5M11.5 19 13.5 21 17.5 16.5',
  // Pair programming : deux personnes côte à côte, et les chevrons du code
  // au-dessus d'elles. L'espace franc entre les deux groupes est ce qui rend
  // l'icône lisible : la densité est l'ennemie d'un dessin à 20 px.
  pairProgramming:
    'M7 6.5 4.5 9 7 11.5M17 6.5 19.5 9 17 11.5M8.5 17.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5M15.5 17.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5M5 21c0-1.6 1.6-2.6 3.5-2.6s3.5 1 3.5 2.6M12 21c0-1.6 1.6-2.6 3.5-2.6S19 19.4 19 21',
  // Débogage : la loupe sur une ligne brisée, l'anomalie que l'on cherche.
  debugging: 'M3.5 16l3.5-4 3 2.5 4-6M10.5 12.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0M17.5 15.5 20.5 18.5',
  // Préparation d'entretien : une bulle de parole avec trois points.
  interview:
    'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4zM8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01',
  discussion:
    'M4.5 5.5h11a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3zM19.5 9h0a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-1.5l-2 2v-2',

  // --- États et retours ---------------------------------------------------
  check: 'M5 12.5 9.5 17 19 7',
  warning: 'M12 4 21 19.5H3zM12 10v4M12 16.5h.01',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 11v5.5M12 8h.01',
  report: 'M5 3.5v17M5 5h9l-1.2 3L14 11H5',
  plus: 'M12 5.5v13M5.5 12h13',
  trash: 'M4.5 7.5h15M9 7.5V5.5h6v2M6.5 7.5 7.5 20h9l1-12.5M10.5 11v5.5M13.5 11v5.5',
  edit: 'M16.5 4.5 19.5 7.5 9 18H6v-3zM14 7l3 3',
  external:
    'M14 4.5h5.5V10M19 5 12 12M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10',
} as const

export type IconName = keyof typeof PATHS

/** Tous les noms disponibles, pour la page de démonstration et les tests. */
export const ICON_NAMES = Object.keys(PATHS) as IconName[]
