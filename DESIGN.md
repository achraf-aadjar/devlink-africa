---
name: DevLink Africa
description: Plateforme d'échange de compétences entre développeurs africains, en thème sombre, un seul accent bleu.
colors:
  brand: "#1f6feb"
  brand-hover: "#1a5fd0"
  accent-glow: "#388bfd"
  accent-link: "#58a6ff"
  violet: "#a371f7"
  canvas: "#0d1117"
  surface: "#161b22"
  surface-raised: "#21262d"
  border: "#30363d"
  text-muted: "#818a95"
  text-secondary: "#8b949e"
  text-body: "#c9d1d9"
  text-strong: "#e6edf3"
  paper: "#f0f2f5"
  paper-hover: "#e3e6eb"
  paper-active: "#dde1e7"
  paper-line: "#d0d7de"
  paper-text: "#3d444d"
  paper-ink: "#0d1117"
typography:
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
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
  header-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-text}"
    rounded: "16px"
---

# Design System: DevLink Africa

## Overview

**Creative North Star: "Le Carrefour des pairs"**

Deux anneaux qui se recouvrent, comme le logo : chaque écran montre ce que deux personnes se donnent l'une à l'autre. Le système est sombre, calme et lisible. Un seul accent bleu porte l'action ; le violet n'apparaît que comme second ton des dégradés et des halos. L'interface s'efface devant les profils, les scores expliqués et les cercles d'échange.

Le site est utilisé par des développeurs, souvent sur smartphone et en plein jour. La lisibilité et le contraste (WCAG AA) passent avant l'ambiance.

**Key Characteristics:**
- Fond quasi noir, cartes séparées par un liseré clair plutôt que par une ombre.
- Un seul accent bleu pour l'action ; la pastille d'en-tête claire est le seul élément sur fond clair.
- Formes arrondies et assurées : boutons en pilule, cartes à 24 px.
- Polices système, aucune dépendance de licence.

## Colors

Un canevas presque noir, des gris froids pour le texte, un bleu d'action, une pastille claire en haut.

### Primary
- **Bleu d'action** (#1f6feb, survol #1a5fd0) : boutons principaux, pastilles de compte, étapes actives. Le blanc dessus passe à 4,6:1.
- **Bleu lumineux** (#388bfd) et **bleu de lien** (#58a6ff) : liens, icônes et texte d'accent sur fond sombre.

### Secondary
- **Violet de halo** (#a371f7) : second ton des dégradés (barres de progression, tuiles actives) et des halos de fond. Jamais un texte.

### Neutral
- **Canevas** (#0d1117) : fond de page. **Surface** (#161b22) : cartes, modales. **Surface relevée** (#21262d) : survols. **Bordure** (#30363d) : séparations.
- **Texte** : fort (#e6edf3), corps (#c9d1d9), secondaire (#8b949e), discret (#818a95, 4,94:1 sur les cartes).
- **Pastille claire** : fond (#f0f2f5), texte (#3d444d), encre (#0d1117), survol (#e3e6eb), actif (#dde1e7), trait (#d0d7de). Réservée à l'en-tête.

### Named Rules
**The One Voice Rule.** Le bleu d'action désigne l'action principale de l'écran. Il ne sert pas de décor.
**The Muted Floor Rule.** Aucun texte en dessous de #818a95 sur fond sombre : en dessous, le contraste AA n'est plus tenu.

## Typography

**Display / Body Font:** polices système (system-ui, Segoe UI, Roboto, Arial)
**Mono Font:** ui-monospace (données et code seulement)

**Character:** neutre, rapide à charger, sans coût de licence. La hiérarchie vient de la taille et du poids, pas de la famille.

### Hierarchy
- **Titre de page** (700, 1.875rem, tracking resserré) : un seul par page.
- **Titre de section** (600, 1.125rem) : sections et cartes.
- **Corps** (400, 1rem / 0.875rem, interligne 1.5) : texte courant ; lignes longues limitées par la largeur du conteneur.
- **Étiquette** (500, 0.875rem) : boutons, champs, onglets.
- **Aide** (400, 0.75rem, #818a95) : indications sous un champ.

### Named Rules
**The Twelve Floor Rule.** Rien en dessous de 12 px (0.75rem).

## Layout

Conteneur centré à largeur maximale ; l'accueil est pleine largeur. Deux largeurs de page : standard (formulaires, détail d'un élément) et large (grilles de cartes, observatoire). En-tête collant en pastille flottante. Le menu se replie en liste sous l'en-tête jusqu'à 1024 px (1280 px pour un compte connecté). Rythme d'espacement par pas de 4 px, groupes serrés, sections séparées largement.

Sur pointeur tactile, toute cible interactive fait au moins 44 px (`pointer: coarse`).

## Elevation & Depth

Hybride, bordures d'abord. Les cartes (`.surface`) se séparent du fond par un liseré intérieur blanc à 7 % et un voile très léger. L'ombre bleue ne marque que l'action principale et l'état actif.

### Shadow Vocabulary
- **Carte** (`0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.25)`) : pastille d'en-tête et cartes surélevées.
- **Halo d'action** (`0 0 0 1px rgba(56,139,253,.45), 0 8px 28px -8px rgba(31,111,235,.7)`) : bouton principal, étape active.
- **Halo doux** (`0 0 0 1px rgba(56,139,253,.2), 0 20px 60px -24px rgba(56,139,253,.5)`) : fenêtres modales.

### Named Rules
**The Border First Rule.** Un liseré sépare ; le halo n'est qu'un renfort sur l'action.

## Shapes

Boutons et onglets en pilule (9999 px). Cartes à 24 px, champs à 12 px, pastille d'en-tête à 16 px. Les icônes sont dessinées par l'équipe, au même trait. Les logos et motifs (anneaux, points, tissage) sont des SVG maison.

## Components

### Buttons
- **Shape:** pilule (9999 px).
- **Primary:** fond bleu d'action (#1f6feb), texte blanc, halo, 8 px × 20 px ; 44 px de haut sur écran tactile.
- **Hover / Focus:** le fond fonce (#1a5fd0) plutôt que de s'éclaircir, pour garder le contraste ; anneau de focus bleu avec décalage, visible partout.
- **Secondary / Ghost / Danger:** voile blanc à 6 %, texte seul, ou rouge plein.

### Cards / Containers
- **Corner Style:** 24 px.
- **Background:** voile blanc dégradé de 4,5 % à 1,5 % sur le canevas.
- **Border:** liseré intérieur blanc à 7 %.
- **Internal Padding:** 20 à 24 px.

### Inputs / Fields
- **Style:** 12 px de rayon, fond blanc à 3 %, placeholder #818a95.
- **Focus:** bordure bleue à 70 % et fond blanc à 5 %.
- **Error / Disabled:** message sous le champ, relié par `aria-describedby`.

### Navigation
Pastille claire flottante et collante en haut. Liens en gris foncé sur fond clair, actif en encre sur fond #dde1e7, inscription en bouton bleu. Sur mobile, bouton menu et liste sous l'en-tête. Un bouton de langue bascule français et anglais.

### Cercle d'échange (signature)
Diagramme de 3 ou 4 personnes reliées par des flèches lumineuses (trait qui défile, coupé en mouvement réduit). Le score d'un match est un anneau dégradé bleu vers violet.

## Do's and Don'ts

### Do:
- **Do** passer chaque texte par `t()` : l'interface doit pouvoir accueillir d'autres langues.
- **Do** garder le contraste AA : texte ≥ 4,5:1, icônes et focus ≥ 3:1.
- **Do** utiliser les jetons (`brand`, `violet`, `paper`, `ink`, `accent`) plutôt que des hex.
- **Do** donner 44 px aux cibles tactiles.

### Don't:
- **Don't** ajouter un deuxième accent à côté du bleu.
- **Don't** utiliser de texte en dessous de #818a95 sur fond sombre.
- **Don't** couper tout mouvement en mouvement réduit : garder les fondus courts.
- **Don't** introduire de ressource tierce non déclarée (police, image, icône) : les licences sont strictes.
