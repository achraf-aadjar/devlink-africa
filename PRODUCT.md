# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Développeurs africains qui veulent apprendre : ils savent faire certaines choses, en cherchent d'autres, et ne trouvent pas les bons pairs (compétences dispersées entre GitHub, LinkedIn, Discord et WhatsApp). Le jury du concours CADEV 2026 (Systalink) évalue le produit, mais n'est pas l'utilisateur principal.

## Product Purpose
Plateforme d'échange de compétences entre développeurs africains. Boucle : profil → compétences proposées et recherchées → recherche → Dev Match expliqué → proposition d'échange (mentorat, revue de code, pair programming…) → projet dans le Project Hub. Succès : deux développeurs qui se complètent se trouvent, échangent, et collaborent.

## Positioning
- **Dev Match toujours expliqué** : score sur 100, six critères pondérés, chaque point justifié à l'écran.
- **Cercles d'échange** : boucles de 3 ou 4 personnes où chacun apprend au suivant quand aucune paire ne se complète.
- **Échange, pas recrutement** : troc entre pairs ; le moyen de contact n'est visible qu'après acceptation de l'échange.
- **Observatoire + validation par les pairs** : offre et demande de compétences sur le continent (chiffres, aucun nom), validations nominatives sur le profil public.

## Operating Context
Concours CADEV 2026 : soumission le 24 oct. 2026, démo en direct de 11 minutes, données de démonstration (`seed_demo`) fictives et signalées comme telles dans l'interface.

## Capabilities and Constraints
- Pile existante : React 19 + TypeScript + Vite + Tailwind CSS 3 (frontend), Django 5.2 + DRF (backend).
- Interface actuellement en français et en anglais. **L'internationalisation doit rester extensible** : d'autres langues pourront être ajoutées plus tard, donc aucune chaîne en dur, textes à longueur variable, pas de logique limitée à deux langues.
- Gel des fonctionnalités le 21 oct. 2026.
- Fonctions d'IA présentes mais désactivées par défaut.
- Licences strictes (pas de LGPL ni ressource tierce non déclarée).

## Brand Commitments
Nom : DevLink Africa. Logo, icônes et motifs dessinés par l'équipe ; aucune ressource tierce.

## Evidence on Hand
Captures d'écran dans `docs/captures/`, documentation dans `docs/`. Aucun témoignage ni chiffre d'usage réel : ne rien inventer.

## Product Principles
1. Toute recommandation se justifie à l'écran.
2. L'échange entre pairs prime sur la visibilité ou le recrutement.
3. La vie privée d'abord : contact débloqué seulement après accord, observatoire anonyme.
4. Un produit pensé pour tout le continent, multilingue par conception.

## Accessibility & Inclusion
WCAG AA : contraste, focus visibles, navigation clavier, états d'erreur lisibles.
