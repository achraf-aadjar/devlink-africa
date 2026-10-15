---
name: DevLink Africa
description: Plateforme d'échange de compétences entre développeurs africains, claire par défaut et sombre quand l'appareil l'est, un seul accent bleu.
colors:
  brand: "#1f6feb"
  brand-hover: "#1a5fd0"
  accent-glow: "#388bfd"
  accent-link: "#0550ae"
  accent-link-dark: "#58a6ff"
  violet: "#a371f7"
  canvas: "#ffffff"
  canvas-dark: "#0d1117"
  surface: "#f6f8fa"
  surface-dark: "#161b22"
  surface-raised: "#eaeef2"
  surface-raised-dark: "#21262d"
  border: "#d0d7de"
  border-dark: "#30363d"
  text-muted: "#59636e"
  text-muted-dark: "#818a95"
  text-secondary: "#57606a"
  text-secondary-dark: "#8b949e"
  text-body: "#32383f"
  text-body-dark: "#c9d1d9"
  text-strong: "#1f2328"
  text-strong-dark: "#e6edf3"
  danger: "#b31d28"
  danger-dark: "#ff7b72"
  success: "#1a7031"
  success-dark: "#3fb950"
  warning: "#7d4e00"
  warning-dark: "#d29922"
  info: "#075985"
  info-dark: "#7dd3fc"
  chart-wanted: "#d95926"
  chart-offered: "#3987e5"
  paper: "#f0f2f5"
  paper-hover: "#e3e6eb"
  paper-active: "#dde1e7"
  paper-line: "#d0d7de"
  paper-text: "#3d444d"
  paper-ink: "#0d1117"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    letterSpacing: "-0.025em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.875rem"
rounded:
  field: "12px"
  header: "16px"
  card: "24px"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
  button-danger:
    backgroundColor: "#dc2626"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
  button-danger-hover:
    backgroundColor: "#b91c1c"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
  badge-offered:
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-wanted:
    textColor: "{colors.info}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-demo:
    textColor: "{colors.warning}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  header-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-text}"
    rounded: "{rounded.header}"
---

# Design System: DevLink Africa

## Overview

**Creative North Star: "Le Carrefour des pairs"**

Deux anneaux qui se recouvrent, comme le logo : chaque écran montre ce que deux personnes se donnent l'une à l'autre. Le système est calme et lisible. Il est clair par défaut et passe en sombre quand l'appareil est en mode sombre (`prefers-color-scheme`). Un seul accent bleu porte l'action ; le violet n'apparaît que comme second ton des dégradés et des halos. L'interface s'efface devant les profils, les scores expliqués et les cercles d'échange.

Le site est utilisé par des développeurs, souvent sur smartphone et en plein jour : c'est pour cela que le thème clair est le thème par défaut. La lisibilité et le contraste (WCAG AA) passent avant l'ambiance, dans les deux thèmes.

**Key Characteristics:**
- Thème clair par défaut, sombre selon l'appareil ; chaque couleur porteuse de texte a une valeur par thème.
- Cartes séparées par un liseré fin plutôt que par une ombre.
- Un seul accent bleu pour l'action ; la pastille d'en-tête claire flotte au-dessus des deux thèmes.
- Formes arrondies et assurées : boutons en pilule, cartes à 24 px.
- Polices système, aucune dépendance de licence.

## Colors

Un fond blanc (ou presque noir en sombre), des gris froids pour le texte, un bleu d'action, une pastille claire en haut, et quatre couleurs d'état réservées aux messages et aux étiquettes.

Les neutres, l'accent et les états vivent en variables CSS dans `frontend/src/index.css` (triplets RGB, redéfinis sous `prefers-color-scheme: dark`) ; `tailwind.config.js` n'en garde que les noms. Dans le frontmatter, la clé sans suffixe est la valeur du thème clair, la clé `-dark` celle du thème sombre.

### Primary
- **Bleu d'action** (`brand`, survol `brand-hover`) : boutons principaux, pastilles de compte, étapes actives. Identique dans les deux thèmes ; le blanc dessus passe à 4,6:1.
- **Bleu lumineux** (`accent-glow`) : halos et anneau de score.
- **Bleu de lien** (`accent-link` / `accent-link-dark`) : liens, icônes et texte d'accent. Foncé sur fond clair (7,6:1), clair sur fond sombre.

### Secondary
- **Violet de halo** (`violet`) : second ton des dégradés (barres de progression, tuiles actives, anneau de score) et des halos de fond. Jamais un texte.

### Neutral
- **Canevas** (`canvas`) : fond de page. **Surface** (`surface`) : cartes, modales, champs. **Surface relevée** (`surface-raised`) : survols, étiquette neutre, bouton désactivé. **Bordure** (`border`) : séparations.
- **Texte** : fort (`text-strong`), corps (`text-body`), secondaire (`text-secondary`), discret (`text-muted`). En clair, même le texte discret dépasse 5,7:1 ; en sombre, il tient 4,94:1 sur les cartes.
- **Voile** : noir d'encre à faible opacité en clair, blanc en sombre. Il remplace `white/xx` pour tous les fonds et liserés translucides, afin qu'une même classe marche dans les deux thèmes.
- **Pastille claire** (`paper`, `paper-hover`, `paper-active`, `paper-line`, `paper-text`, `paper-ink`) : réservée à l'en-tête, identique dans les deux thèmes.

### États
Une valeur par thème, choisie pour tenir 4,5:1 en texte sur la page et sur les cartes, et réutilisée à 10–15 % d'opacité pour le fond d'un encadré ou d'une étiquette.
- **Erreur** (`danger`) : messages d'erreur, bordure d'un champ invalide, survol de « Retirer ».
- **Réussite** (`success`) : confirmations, compétences proposées (« Je sais faire »), étapes faites, panneau de contact débloqué.
- **Avertissement** (`warning`) : étiquette « Profil de démonstration ».
- **Information** (`info`) : compétences recherchées (« Je veux apprendre »).

### Données
- **Demande** (`chart-wanted`, orange) et **offre** (`chart-offered`, bleu) : les deux séries de l'observatoire, validées pour les daltoniens (ΔE 26,8) et à au moins 3:1 sur les surfaces. Elles ne colorent que des barres et des pastilles de légende, jamais un texte.

### Named Rules
**The One Voice Rule.** Le bleu d'action désigne l'action principale de l'écran. Il ne sert pas de décor. Seule exception : l'orange de l'observatoire, qui distingue une série de données et ne porte jamais une action.
**The Two Themes Rule.** Une couleur qui porte du texte passe par un jeton à double valeur (`ink`, `accent`, `veil`, `danger`, `success`, `warning`, `info`). Une teinte Tailwind fixe (`red-400`, `emerald-300`…) n'est lisible que dans un seul thème.
**The Muted Floor Rule.** Aucun texte plus pâle que `text-muted` du thème courant : en dessous, le contraste AA n'est plus tenu.

## Typography

**Display / Body Font:** polices système (system-ui, Segoe UI, Roboto, Arial)
**Mono Font:** ui-monospace (données et code seulement)

**Character:** neutre, rapide à charger, sans coût de licence. La hiérarchie vient de la taille et du poids, pas de la famille.

### Hierarchy
- **Titre de page** (700, 1.875rem, tracking resserré) : un seul par page.
- **Titre de section** (600, 1.125rem) : sections et cartes.
- **Corps** (400, 1rem / 0.875rem, interligne 1.5) : texte courant ; lignes longues limitées par la largeur du conteneur.
- **Étiquette** (500, 0.875rem) : boutons, champs, onglets.
- **Aide** (400, 0.75rem, `text-muted`) : indications sous un champ.
- **Chiffres** : `tabular-nums` pour les compteurs et les scores.

### Named Rules
**The Twelve Floor Rule.** Rien en dessous de 12 px (0.75rem).

## Layout

Conteneur centré, gouttière de 16 px (24 px dès 640 px) ; l'accueil est pleine largeur. Deux largeurs de page :
- **Standard** (1280 px max) : formulaires, profil, détail d'un match ou d'un projet.
- **Large** (1440 px max) : grilles de cartes (recherche, matchs, cercles, projets, pays, observatoire, tableau de bord).

L'en-tête et le pied de page prennent toujours la largeur large, pour rester alignés entre eux quelle que soit la page. En-tête collant en pastille flottante : le fond de chaque page (halo, bannière) passe dessous jusqu'en haut de l'écran, et le contenu se cale sous la pastille grâce à sa hauteur mesurée (`--header-h`). Le menu se replie en liste sous l'en-tête jusqu'à 1024 px (1280 px pour un compte connecté, qui a plus de liens). Les en-têtes de profil posent l'avatar (80 px) à gauche du nom, les actions à droite. Rythme d'espacement par pas de 4 px, groupes serrés, sections séparées largement.

Les écrans d'authentification ont leur propre gabarit : sur grand écran, un panneau photo à gauche et le formulaire à droite sur le canevas ; sur mobile, le formulaire seul.

Sur pointeur tactile, toute cible interactive fait au moins 44 px (`pointer: coarse`).

## Elevation & Depth

Hybride, bordures d'abord. Les cartes (`.surface`) se séparent du fond par un liseré intérieur de voile à 7 % et un voile dégradé de 4,5 % à 1,5 %. Comme le voile change de couleur avec le thème, la même carte est un gris très pâle en clair et un gris à peine levé en sombre. L'ombre bleue ne marque que l'action principale, l'état actif et le survol d'une carte cliquable.

### Shadow Vocabulary
- **Carte** (`0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.25)`) : pastille d'en-tête et bulles d'information.
- **Halo d'action** (`0 0 0 1px rgba(56,139,253,.45), 0 8px 28px -8px rgba(31,111,235,.7)`) : bouton principal, étape active, avatar d'en-tête.
- **Halo doux** (`0 0 0 1px rgba(56,139,253,.2), 0 20px 60px -24px rgba(56,139,253,.5)`) : fenêtres modales, survol d'une carte cliquable.

### Named Rules
**The Border First Rule.** Un liseré sépare ; le halo n'est qu'un renfort sur l'action.

## Shapes

Boutons, onglets et étiquettes en pilule. Cartes à 24 px, champs à 12 px, pastille d'en-tête à 16 px. Les icônes sont dessinées par l'équipe, au même trait. Les logos et motifs (anneaux, points, tissage) sont des SVG maison.

## Components

### Buttons
- **Shape:** pilule.
- **Primary:** fond bleu d'action, texte blanc, halo, 8 px × 20 px ; 44 px de haut sur écran tactile.
- **Hover / Focus:** le fond fonce (`brand-hover`) plutôt que de s'éclaircir, pour garder le contraste ; anneau de focus bleu de 2 px avec décalage.
- **Disabled:** fond `surface-raised`, texte `text-secondary`, sans halo, opacité 70 % : on lit encore ce que fera le bouton.
- **Secondary / Ghost / Danger:** voile à 6 % avec liseré, texte seul, ou rouge plein (le survol fonce lui aussi).
- **Lien en forme de bouton:** une navigation qui doit ressembler à un bouton utilise `ButtonLink` (mêmes variantes et tailles). Jamais un `<Button>` dans un `<Link>`.

### Badges
- **Style:** pilule, 12 px, 500. Fond teinté à 10 % de la couleur d'état, liseré intérieur à 20–25 %, texte plein de la même couleur.
- **Variantes:** compétence proposée (`success`), compétence recherchée (`info`), profil de démonstration (`warning`), neutre (`surface-raised` + texte secondaire), accent (bleu pâle).

### Cards / Containers
- **Corner Style:** 24 px.
- **Background:** voile dégradé de 4,5 % à 1,5 % sur le canevas.
- **Border:** liseré intérieur de voile à 7 %.
- **Interactive:** une carte qui mène à une page de détail se lève de 4 px au survol, avec le halo doux et un liseré bleu.
- **Internal Padding:** 20 à 24 px.

### Inputs / Fields
- **Style:** 12 px de rayon, fond de voile à 3 %, bordure de voile à 10 %, placeholder `text-muted`. Les listes déroulantes natives prennent le même gabarit avec un chevron dessiné par l'équipe, y compris les petites listes en ligne (niveau d'une compétence).
- **Focus:** bordure bleue à 70 % et fond de voile à 5 %.
- **Error:** bordure `danger` à 70 % et message `danger` sous le champ, relié par `aria-describedby`.
- **Écrans d'authentification:** le champ actif se signale par sa seule bordure bleue, sans anneau.

### Navigation
Pastille claire flottante et collante en haut, dans les deux thèmes. Liens en gris foncé sur fond clair, actif en encre sur fond `paper-active`, inscription en bouton bleu. Sur mobile, bouton menu et liste sous l'en-tête. Un bouton de langue bascule français et anglais.

### Cercle d'échange (signature)
Diagramme de 3 ou 4 personnes reliées par des flèches lumineuses (trait qui défile, coupé en mouvement réduit). Le score d'un match est un anneau dégradé bleu vers violet.

## Do's and Don'ts

### Do:
- **Do** passer chaque texte par `t()`, et les nombres par `tn()` : l'interface doit pouvoir accueillir d'autres langues.
- **Do** garder le contraste AA dans les deux thèmes : texte ≥ 4,5:1, icônes et focus ≥ 3:1.
- **Do** utiliser les jetons (`brand`, `violet`, `paper`, `ink`, `accent`, `veil`, `danger`, `success`, `warning`, `info`) plutôt que des hex.
- **Do** donner 44 px aux cibles tactiles.

### Don't:
- **Don't** ajouter un deuxième accent à côté du bleu.
- **Don't** utiliser une teinte Tailwind fixe (`red-400`, `emerald-950`…) pour un texte ou un fond d'état : elle ne marche que dans un thème.
- **Don't** écrire de pluriel en « (s) » : `tn()` choisit la forme selon la langue.
- **Don't** utiliser de texte plus pâle que `text-muted`.
- **Don't** couper tout mouvement en mouvement réduit : garder les fondus courts.
- **Don't** introduire de ressource tierce non déclarée (police, image, icône) : les licences sont strictes.
