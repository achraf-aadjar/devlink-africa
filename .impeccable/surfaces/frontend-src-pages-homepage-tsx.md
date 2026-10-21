---
version: 1
slug: "frontend-src-pages-homepage-tsx"
primary_target: "frontend/src/pages/HomePage.tsx"
related_targets: ["frontend/src"]
---

# Surface brief : accueil et monde visuel de DevLink Africa

Portée : la page d'accueil (`frontend/src/pages/HomePage.tsx`, mode Persuade) porte le nouveau monde ; tout le reste du front (mode Operate) en reçoit seulement la typographie, la palette, la densité et le geste signature.

Public : développeurs africains, souvent sur Android milieu de gamme, en plein jour ; jury CADEV pendant 11 minutes de démo.
Action : dire ce qu'on sait faire et ce qu'on veut apprendre, voir ses matchs, proposer un échange.
Preuve : le cercle de démonstration Dakar → Accra → Nairobi et un score expliqué point par point (données de démo signalées comme telles).
Contraintes confirmées par l'utilisateur (2026-10-14) : un bleu d'action à nous, plus de violet ni de halo ; police OFL déclarée qui couvre le latin africain ; tout le plan de la critique avant le gel du 21 octobre.

## Direction contract

THESIS : chaque Dev Match se montre comme un entraîneur montre une combinaison : aimants, flèches au feutre, score et feuille de match. Refuse le hero SaaS centré à halo, les grilles de cartes identiques et l'anneau de progression.

OWN-WORLD : tableau blanc émaillé (fond chaud presque blanc), feuilles blanches posées dessus avec filet d'encre, barre d'en-tête noire comme un tableau d'affichage. Encre noire, bleu maillot pour l'action et l'offre, orange pour la demande, aimants ronds pleins pour les avatars. Fira Sans Extra Condensed en capitales et chiffres tabulaires pour les titres, noms et scores ; Fira Sans pour l'interface. Rayons de 4 à 8 px, aucune ombre colorée, aucun dégradé. Thème sombre : ardoise.

STORY : le visiteur comprend en un écran qu'on y échange des compétences entre pairs, croit au match parce que le score se lit point par point, et remplit sa feuille de match pour voir ses matchs.

FIRST VIEWPORT : le tableau tactique occupe l'écran. En haut à gauche, titre en capitales condensées sur deux à trois lignes ; à droite et au centre, le cercle de démo en aimants reliés par des flèches au feutre étiquetées par compétence, qui se tracent une fois. En bas à gauche, une feuille de match épinglée : « Je sais faire » / « Je veux apprendre » et le bouton bleu « Voir mes matchs » (vrai formulaire vers la recherche). Plaque de score noire en bas à droite.

FORM : « La feuille de match » (tableau tactique + feuille de match imprimée), rang 4 de ma liste ; seed b6951539. Relèvements : lignes classées à colonnes fixes (tableau des départs) ; une seule fiche ouverte à la fois (présentoir) ; peu de tailles décisives sur une grille de 4 px (néobrutalisme) ; phases d'échange nommées, jamais la couleur seule (cyclorama). Garde-fous : jamais pelouse verte ni ticket de pari.

FINISH : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
