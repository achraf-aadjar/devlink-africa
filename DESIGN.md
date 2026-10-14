---
name: DevLink Africa
description: "La feuille de match : un tableau tactique émaillé où les développeurs africains se montrent en aimants, flèches au feutre et scores lisibles point par point."
colors:
  tableau: "#f2f2ed"
  feuille: "#ffffff"
  filet-clair: "#e7e7e1"
  filet: "#c9cac3"
  encre-discrete: "#64676d"
  encre-secondaire: "#5a5d63"
  encre-courante: "#43464c"
  encre-texte: "#2d3036"
  encre: "#16181d"
  ardoise: "#131518"
  ardoise-feuille: "#1b1e23"
  ardoise-filet: "#33373e"
  ardoise-encre: "#eeefec"
  bleu-maillot: "#1a4fc0"
  bleu-maillot-fonce: "#143e9a"
  bleu-maillot-ardoise: "#2f62d6"
  bleu-maillot-ardoise-fonce: "#2552bd"
  bleu-lien: "#163f9e"
  bleu-lien-ardoise: "#7fa6ff"
  bleu-teinte: "#e8eefb"
  orange-demande: "#a13f0a"
  orange-demande-ardoise: "#ff9a62"
  orange-aimant: "#c24d12"
  tableau-affichage: "#16181d"
  tableau-affichage-ardoise: "#0a0b0d"
  affichage-texte: "#e9eae6"
  affichage-discret: "#b3b6bb"
  affichage-repere: "#8fb1ff"
  danger: "#b42318"
  danger-ardoise: "#ff7b6e"
  succes: "#17703a"
  succes-ardoise: "#4cc07a"
  avertissement: "#855000"
  avertissement-ardoise: "#e0a33a"
  info: "#0b5f86"
  info-ardoise: "#7cc8ee"
  aimant-sarcelle: "#0e6b63"
  aimant-ocre: "#7a4a00"
  aimant-grenat: "#8a2d4e"
typography:
  display:
    fontFamily: "Fira Sans Extra Condensed, Fira Sans, Arial Narrow, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "normal"
  headline:
    fontFamily: "Fira Sans Extra Condensed, Fira Sans, Arial Narrow, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
  title:
    fontFamily: "Fira Sans Extra Condensed, Fira Sans, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.01em"
  body:
    fontFamily: "Fira Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Fira Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
  score:
    fontFamily: "Fira Sans Extra Condensed, Fira Sans, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
rounded:
  sm: "2px"
  tag: "4px"
  md: "6px"
  card: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  card: "20px"
  card-lg: "24px"
  section: "64px"
  section-lg: "80px"
components:
  button-primary:
    backgroundColor: "{colors.bleu-maillot}"
    textColor: "{colors.feuille}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.bleu-maillot-fonce}"
  button-secondary:
    backgroundColor: "{colors.feuille}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.filet-clair}"
  button-ghost:
    textColor: "{colors.encre-courante}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.feuille}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
  card:
    backgroundColor: "{colors.feuille}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.feuille}"
    textColor: "{colors.encre}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  tag-offre:
    backgroundColor: "{colors.bleu-teinte}"
    textColor: "{colors.bleu-lien}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  tag-demande:
    textColor: "{colors.orange-demande}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  score-plate:
    backgroundColor: "{colors.tableau-affichage}"
    textColor: "{colors.affichage-texte}"
    typography: "{typography.score}"
    rounded: "{rounded.tag}"
    height: "48px"
  header-bar:
    backgroundColor: "{colors.tableau-affichage}"
    textColor: "{colors.affichage-discret}"
    height: "60px"
  magnet:
    textColor: "{colors.feuille}"
    rounded: "{rounded.full}"
    size: "40px"
---

# Design System: DevLink Africa

## Overview

**Creative North Star: "La feuille de match"**

Chaque Dev Match se montre comme un entraîneur montre une combinaison : des aimants ronds posés sur un tableau tactique émaillé, des flèches tracées au feutre entre eux, une plaque de score noire et une feuille de match imprimée. La page est le tableau (blanc chaud, presque blanc) ; les cartes, champs et fenêtres sont des feuilles blanches posées dessus, cernées d'un filet d'encre ; l'en-tête est le tableau d'affichage, noir dans les deux thèmes. L'encre est noire, l'action et l'offre sont en bleu maillot, la demande en orange : les deux couleurs d'aimants de l'entraîneur.

Le monde est dense et lisible en plein soleil, sur un Android de milieu de gamme : peu de tailles décisives, des capitales condensées pour ce qui se lit de loin (titres, noms, scores), une interface en Fira Sans pour tout le reste. Le thème sombre n'est pas une inversion mais une ardoise : même grammaire, mêmes rôles, teintes recalculées. Une zone peut porter l'ardoise localement (le panneau des écrans de connexion) sans toucher le reste de la page.

Rejets confirmés : pas de dégradé, pas de halo ni d'ombre colorée, pas de violet, pas de hero SaaS centré, pas d'anneau de progression, jamais de pelouse verte ni d'esthétique de ticket de pari.

**Key Characteristics:**
- Tableau chaud (clair) ou ardoise (sombre), feuilles posées dessus avec filet et ombre courte.
- Barre d'en-tête et plaques de score noires dans les deux thèmes.
- Bleu = action et offre ; orange = demande. Jamais l'inverse, jamais la couleur seule.
- Capitales condensées Fira Sans Extra Condensed pour titres, noms, scores ; Fira Sans pour l'interface.
- Geste signature : aimants, flèches au feutre tracées une fois, plaque de score, barre de 100 points.

## Colors

Une palette d'encre sur émail : neutres chauds, un bleu, un orange, et du noir de tableau d'affichage. Les valeurs vivent en triplets RVB dans `frontend/src/index.css` (variables `--ink-*`, `--accent-*`, `--brand`, `--demand`, `--bar`, `--veil`, états) et changent avec le thème ; Tailwind n'en garde que les noms. Les hex ci-dessus sont les valeurs résolues du thème « tableau », suffixées `-ardoise` pour le thème sombre.

### Primary
- **Bleu maillot** (bleu-maillot ; ardoise : bleu-maillot-ardoise) : boutons principaux, bouton « S'inscrire » de la barre, remplissage de la barre de score, flèches de ce que vous donnez, étiquettes d'offre (« Je sais faire »), pastille d'épingle. Blanc dessus à 7,2:1 (5,5:1 en ardoise). Au survol il fonce (bleu-maillot-fonce), il ne s'éclaircit jamais.
- **Bleu lien** (bleu-lien, échelle `accent-600`/`accent-700` ; ardoise : bleu-lien-ardoise) : liens, texte d'offre, anneau de focus. Fond teinté `accent-50` (bleu-teinte) pour les étiquettes d'offre et la ligne ouverte d'un classement.

### Secondary
- **Orange demande** (orange-demande en texte ; orange-demande-ardoise en sombre) : tout ce qui relève de « Je veux apprendre » : étiquettes de demande, intitulé de colonne, série « demande » de l'observatoire.
- **Orange aimant** (orange-aimant) : aplats de demande seulement : flèches de ce que vous recevez, pastilles de compteur de la barre. Blanc dessus à 4,8:1.

### Tertiary
- **Tableau d'affichage** (tableau-affichage ; ardoise : tableau-affichage-ardoise) : barre d'en-tête, plaques de score, bandeau d'appel final de l'accueil. Texte affichage-texte, texte discret affichage-discret, repère du lien actif affichage-repere, filets blancs à 14 %. Ces couleurs ne suivent pas l'échelle `ink`.

### Neutral
- **Tableau** (tableau, `ink-50`) : fond de page et du tableau tactique. Ardoise : ardoise.
- **Feuille** (feuille, `ink-100`) : cartes, champs, fenêtres, boutons secondaires. Ardoise : ardoise-feuille.
- **Filets** (filet-clair `ink-200`, filet `ink-300`) : séparateurs de lignes, bordures de champ, piste vide d'une barre.
- **Encres** (encre-discrete `ink-500` à 5,0:1 sur le tableau, encre-secondaire `ink-600`, encre-courante `ink-700`, encre-texte `ink-800` pour le corps, encre `ink-900` pour les titres).
- **Voile** (`--veil` : encre en clair, blanc en ardoise) : liserés et fonds translucides qui doivent marcher dans les deux thèmes (`ring-veil/[0.12]`, survol `veil/[0.06]`).

### États
- **Danger** (danger / danger-ardoise ; aplat destructif danger à 6,6:1), **succès** (succes / succes-ardoise), **avertissement** (avertissement / avertissement-ardoise, aussi l'étiquette « Démo »), **info** (info / info-ardoise). Toujours en fond teinté à 6-10 % avec filet à 20-30 % et texte plein de la même famille, ou en texte seul.

### Aimants (avatars)
Sept teintes pleines tirées du nom (`frontend/src/lib/avatarColors.ts`), initiales blanches à au moins 4,8:1 : bleu-maillot, orange-aimant, encre-texte, aimant-sarcelle, succes, aimant-ocre, aimant-grenat. Une même personne garde sa teinte partout (liste, cercle, tableau).

### Named Rules
**The Deux Aimants Rule.** Le bleu porte l'action et l'offre, l'orange porte la demande. Une interface qui montre un échange les montre toutes deux, et chaque sens est aussi écrit en toutes lettres : jamais la couleur seule.

**The Tableau d'Affichage Rule.** La barre d'en-tête et les plaques de score sont noires dans les deux thèmes, avec leurs propres teintes `bar-*`. Elles ne prennent jamais l'échelle `ink`.

**The Pas de Halo Rule.** Aucun dégradé, aucune ombre colorée, aucun violet. Une couleur est un aplat ou un fond teinté, rien d'autre.

## Typography

**Display Font:** Fira Sans Extra Condensed (avec Fira Sans, Arial Narrow)
**Body Font:** Fira Sans (avec system-ui, Segoe UI, Roboto, Arial)
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Consolas (code seulement)

**Character:** Les capitales condensées de la feuille de match et du tableau d'affichage, pour ce qui se lit d'un coup d'œil ; une humaniste sobre et robuste pour lire et agir. Les deux sont sous SIL OFL 1.1, hébergées avec le site et réduites aux caractères utiles, latin africain compris (ɛ, ɔ, ŋ, ɓ, ɗ, ƙ, ƴ, ẹ, ọ, ṣ et les tons), en `font-display: swap`.

### Hierarchy
- **Display** (700, 2,75rem → 4rem → 4,75rem, interligne 0,92, capitales) : le titre du tableau tactique de l'accueil et le panneau ardoise de connexion (2,75rem → 3,25rem). Un seul par écran.
- **Headline** (700, 2rem → 2,5rem, interligne 1,05, casse normale) : titre de page (`.page-title`), un par page. Les titres de section de l'accueil montent à 2,25rem → 3rem (interligne 1,02).
- **Title** (700, 1,25rem, interligne 1,25, capitales, +0,01em) : titre d'une feuille (`.sheet-title`) : carte, section, fenêtre. Réservé aux titres courts. Les noms sous un aimant et les en-têtes de colonnes d'un classement suivent la même voix condensée en capitales.
- **Score** (700, 1,25rem / 1,75rem / 3,75rem selon la plaque, chiffres tabulaires) : plaques de score, totaux, compteurs.
- **Body** (400, 1rem, interligne 1,5) : texte courant en encre-texte, `max-w-prose` ou `max-w-xl` pour les paragraphes ; 0,875rem pour le texte d'appoint et les tableaux.
- **Label** (500 à 600, 0,875rem) : boutons (600), libellés de champ (500), liens de navigation (500, 15px). Étiquettes en 0,75rem / 500.

### Named Rules
**The Capitales Courtes Rule.** Les capitales condensées sont réservées aux mots qui se lisent de loin : titres courts, noms, intitulés de colonne, scores. Une phrase de corps ne passe jamais en capitales.

**The Chiffres Alignés Rule.** Tout score, total ou compteur est en chiffres tabulaires et au format de la langue (« 82,5 » en français, « 82.5 » en anglais).

## Layout

Une seule largeur d'écran pour toute l'application : conteneur centré de 90rem, marges de 16px (24px dès 640px), pour que le bord gauche du contenu reste aligné sur l'en-tête d'une page à l'autre ; les pages de lecture limitent leurs lignes à l'intérieur. Chaque page fixe son propre espacement vertical. Rythme sur une grille de 4px, avec peu de tailles décisives : 16px entre éléments, 20/24px de marge intérieure de feuille, 64/80px entre sections de l'accueil, séparées par un filet `ink-300` plutôt que par un changement de fond.

Les classements sont des lignes à colonnes fixes, comme un tableau des départs : sur grand écran, score (4rem), personne, ce qu'elle vous apprend, ce que vous lui apprenez, bouton d'ouverture (2,75rem). Sur mobile, la ligne garde score, personne et bouton, et les colonnes passent dessous avec leur intitulé visible. Une seule ligne ouverte à la fois, fond `accent-50` à 50 %.

L'accueil pose le tableau tactique sur tout le premier écran (hauteur min. 100svh moins l'en-tête), dans un cadre alu `ink-300` : texte et feuille de match à gauche, cercle de démo à droite, plaque de score en bas à droite. Points de rupture Tailwind par défaut (640, 768, 1024, 1280px).

## Elevation & Depth

Profondeur physique et courte : des feuilles posées sur un tableau, pas des panneaux qui flottent. Trois ombres seulement, toutes neutres, construites sur le voile ou le noir ; aucune ombre colorée. Le filet d'encre (`ring-inset` voile à 12 %) fait l'essentiel du travail de séparation, l'ombre ne fait que poser la feuille.

### Shadow Vocabulary
- **Feuille** (`box-shadow: 0 1px 0 rgb(var(--veil) / 0.06), 0 2px 6px -2px rgb(var(--veil) / 0.12)`) : cartes, feuille de match, tableaux. Toujours avec le filet.
- **Levée** (`box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.12)`) : fenêtres modales et lien d'évitement focalisé, seuls éléments au-dessus de la page.
- **Aimant** (`box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.25)`) : avatars et épingle, un disque en léger relief posé sur le tableau.

### Named Rules
**The Posé Pas Flottant Rule.** Une carte interactive ne se soulève pas au survol : son filet fonce (voile 12 % → 40 %). Seule une fenêtre modale prend l'ombre levée.

## Shapes

Des coins nets de papier imprimé, de 2 à 8px. Feuilles, cartes, états vides et d'erreur à 8px (`rounded-card`, et seulement en haut pour la fenêtre modale sur mobile, qui monte du bas). Boutons, champs, boutons d'icône à 6px. Étiquettes, plaques de score et compteurs à 4px ; étiquettes du cercle et barre de score à 2px. Les aimants, l'épingle et la pastille d'un état vide sont parfaitement ronds. Le trait de feutre a des bouts et des angles ronds (épaisseur 3 en flèche, 1,1 à 1,6 dans le cercle). Un état vide est une ligne blanche de la feuille : bordure en pointillés `ink-400`.

## Components

### Buttons
Francs et lisibles au soleil, ils foncent au survol.
- **Shape:** coins légèrement arrondis (6px), graisse 600, icône et texte espacés de 8px.
- **Primary:** bleu maillot, texte blanc, 8px × 20px (petit 6px × 16px, grand 12px × 28px). Survol bleu-maillot-fonce. Désactivé : fond `ink-200`, texte `ink-600`.
- **Secondary:** feuille blanche cernée d'encre (filet intérieur voile 25 %, 40 % au survol, fond `ink-200` au survol).
- **Ghost:** texte encre-courante, fond voile 6 % au survol.
- **Danger:** aplat danger, texte blanc.
- **Hover / Focus:** transition de couleurs seule ; focus visible partout : anneau 2px `accent-600` décalé de 2px sur le tableau. Sur écran tactile, hauteur minimale 44px. Un lien qui doit avoir l'air d'un bouton (ButtonLink) partage exactement les mêmes classes.

### Chips (étiquettes)
- **Style:** coins 4px, 2px × 8px, 0,75rem / 500, fond teinté à 10 % et texte plein de la même famille, filet intérieur à 20-25 %.
- **Variantes:** offre (bleu), demande (orange), démo (avertissement, « Démo » en liste avec le libellé complet pour les lecteurs d'écran), succès, avertissement, neutre (`ink-200`).

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** feuille (`ink-100`).
- **Shadow Strategy:** ombre feuille + filet voile 12 % (voir Elevation & Depth).
- **Border:** filet intérieur seulement ; les lignes internes en `ink-200`, les totaux sous un trait 2px `ink-900`.
- **Internal Padding:** 20px, 24px dès 640px.

### Inputs / Fields
- **Style:** feuille blanche, bordure 1px `ink-300`, coins 6px, 10px × 14px, texte encre, indication `ink-500`. Liste native au même gabarit avec chevron dessiné.
- **Focus:** la bordure passe au bleu `accent-600`, plus l'anneau de focus global.
- **Error / Disabled:** bordure danger à 70 %, message danger sous le champ, lié par `aria-describedby` et `aria-invalid`. Libellé toujours lié au champ ; astérisque d'obligation en `accent-700`.

### Navigation
- **Style:** barre noire du tableau d'affichage, collante, 60px, logo blanc, liens 15px / 500 en affichage-discret, blancs au survol. Lien actif : texte blanc et trait de 3px affichage-repere sous le lien, comme la ligne en cours d'un tableau des départs. Compteurs en pastilles orange-aimant à chiffres condensés.
- **Mobile:** menu déroulant dans la barre, lignes de 44px, lien actif marqué par une bordure gauche de 3px affichage-repere. Bascules langue (code de la langue proposée) et thème en boutons d'icône de 44px.

### Plaque de score
Un chiffre, pas une jauge. Plaque tableau-affichage, chiffres condensés tabulaires en affichage-texte, filet blanc à 14 %, coins 4px, trois tailles (36, 48, 96px de haut), « /100 » facultatif en affichage-discret. Variante en creux (fond transparent, filet `ink-400`, chiffre `ink-800`) pour tout score sous 50 dans un classement : les bons matchs se détachent d'eux-mêmes. Le chiffre reste du texte ; la figure porte « Score de N sur 100 ».

### Barre de 100 points
Une seule barre de 16px de haut, coins 2px, découpée en cases proportionnelles au poids de chaque critère (espaces de 2px). Chaque case, piste `ink-200`, se remplit en bleu maillot de ce que le critère a rapporté, de gauche à droite, avec 80ms de décalage entre cases. Toujours suivie du tableau des points par critère et du total.

### Aimants et flèches au feutre
L'aimant est l'avatar : disque plein de la palette des sept teintes, initiales blanches en capitales condensées (42 % du diamètre), ombre aimant ; posé sur le tableau, le nom s'écrit dessous en capitales condensées avec une précision en 0,75rem. Les flèches sont des traits courbes à bouts ronds en `currentColor` : bleu maillot pour ce que vous donnez, orange-aimant pour ce que vous recevez, encre dans le cercle. Verticales et dans le cercle, elles se tracent une fois (900ms, `cubic-bezier(0.22, 1, 0.36, 1)`) ; horizontales, elles sont posées d'emblée. Décoratives : le sens de l'échange est toujours écrit à côté. Dans un cercle, chaque flèche porte une étiquette de compétence (feuille, filet encre 70 %, coins 2px, capitales condensées).

### États vides et d'erreur
Vide : ligne en pointillés `ink-400` sur feuille à 60 %, pastille ronde `ink-200` avec pictogramme du sujet, titre, explication de quoi faire, action si possible. Erreur : fond danger à 6 %, filet danger 30 %, pictogramme d'alerte, message annoncé, bouton secondaire « Réessayer ».

### Modal
Feuille au-dessus d'un voile noir à 50 %, ombre levée, filet voile 15 %, 512px de large ; sur mobile elle monte du bas, coins arrondis en haut seulement. Titre en `.sheet-title`, bouton de fermeture de 44px, Échap et clic sur le fond ferment, apparition en fondu de 150ms.

## Do's and Don'ts

### Do:
- **Do** poser chaque contenu sur une feuille (`.surface` : `ink-100`, filet voile 12 %, ombre feuille, coins 8px) et laisser la page au tableau `ink-50`.
- **Do** utiliser les échelles `ink`, `accent`, `brand`, `demand`, `veil` et les états par leur nom Tailwind : elles changent seules entre tableau, ardoise et `.scope-dark`.
- **Do** montrer un échange avec ses deux aimants : bleu pour l'offre et ce que vous donnez, orange pour la demande et ce que vous recevez, et écrire le sens en toutes lettres à côté.
- **Do** afficher un score sur une plaque noire (`ScorePlate`), en creux sous 50 dans un classement, et l'expliquer par une barre de 100 points découpée selon le poids des critères.
- **Do** présenter un classement en lignes à colonnes fixes, une seule ligne ouverte à la fois.
- **Do** passer tout texte visible par `t()` et tout texte au pluriel par `tn(nombre, singulier, pluriel)` ; formater les nombres selon la langue.
- **Do** tenir 4,5:1 pour tout texte et 3:1 pour les barres et pastilles, dans les deux thèmes ; 44px minimum pour toute cible tactile.
- **Do** respecter « réduire les animations » : flèches déjà tracées, barres déjà pleines, seuls les fondus courts restent.
- **Do** signaler chaque profil fictif par l'étiquette « Démo ».

### Don't:
- **Don't** utiliser de dégradé, de halo, d'ombre colorée, de flou d'arrière-plan ni de violet.
- **Don't** inverser les deux couleurs d'aimants, ni coder un sens d'échange par la couleur seule.
- **Don't** faire suivre l'échelle `ink` à la barre d'en-tête ou aux plaques de score : elles restent noires dans les deux thèmes.
- **Don't** représenter un score par un anneau, une jauge circulaire ou une étoile.
- **Don't** soulever une carte au survol : on fonce son filet.
- **Don't** mettre une phrase de corps en capitales condensées, ni écrire un titre long en `.sheet-title`.
- **Don't** aligner des grilles de cartes identiques là où un classement à colonnes fixes dit mieux l'ordre.
- **Don't** évoquer une pelouse verte ou un ticket de pari.
- **Don't** utiliser un caractère typographique (✓, ★, →) comme pictogramme : les pictogrammes passent par le composant `Icon`.
