# Décisions techniques

Une entrée par choix important, avec sa raison. Lecture utile avant l'oral devant le jury.

## 2026-10-06 — PostgreSQL via pg8000 plutôt que SQLite

**Décision.** La base de données est PostgreSQL 17, accédée par le pilote `pg8000`
avec le backend Django `django-pg8000`. SQLite reste utilisable en local avec
`DB_ENGINE=sqlite` (lancement sans Docker, et tests rapides en mémoire).

**Pourquoi.** Le règlement du concours (art. 6) interdit les licences à réciprocité.
Les pilotes PostgreSQL habituels de Django, `psycopg` et `psycopg2`, sont sous LGPL :
ils sont donc exclus. `pg8000` est un pilote PostgreSQL écrit en Python pur, sous
licence BSD-3-Clause, et `django-pg8000` est sous MIT-0. Les licences sont donc
conformes, et l'équipe garde un vrai SGBD (concurrence d'écriture, types `jsonb`,
contraintes, index) au lieu de SQLite.

**Dépendances ajoutées et leurs licences.**

| Paquet | Version | Licence |
|---|---|---|
| pg8000 | 1.31.5 | BSD-3-Clause |
| django-pg8000 | 0.0.5 | MIT-0 |
| scramp | 1.4.17 | MIT-0 |
| asn1crypto | 1.5.1 | MIT |
| python-dateutil | 2.9.0 | Apache-2.0 / BSD |
| pytz | 2026.5 | MIT |
| six | 1.17.0 | MIT |

Le serveur PostgreSQL lui-même est sous licence PostgreSQL (permissive) ; il tourne
dans Docker et n'est pas distribué avec notre code.

**Le coût de ce choix.** `django-pg8000` est jeune (version 0.0.5) et peu utilisé.
Deux défauts ont été corrigés dans `backend/config/db/base.py` :

1. Il déclarait `supports_json_field = False`, ce qui faisait rejeter par Django
   tous nos `JSONField` (erreur de contrôle `fields.E180`).
2. Son `vendor` valait `postgresql_pg8000`, donc Django ne trouvait pas les
   variantes `as_postgresql()` des recherches sur clés JSON, et ces requêtes
   échouaient avec une erreur de syntaxe SQL.

Ces deux correctifs sont couverts par `backend/tests/test_json_fields.py`
(écriture et relecture, `contains`, accès par index, filtre par clé).

**Le risque à surveiller.** Un défaut de ce backend peut encore apparaître sur des
requêtes plus complexes (agrégations, sous-requêtes). La parade est prête : les
modèles n'utilisent aucun champ propre à PostgreSQL (pas d'`ArrayField`, pas de
`SearchVector`), donc un retour à SQLite reste possible avec `DB_ENGINE=sqlite`.
Pour cette raison, les tests tournent sur les deux bases en CI.

**Note sur le cahier des charges.** Sa section 3 demandait « SQLite en mode WAL (le
pilote PostgreSQL est exclu) ». L'exclusion visait `psycopg` ; `pg8000` lève
l'obstacle juridique. L'équipe a choisi PostgreSQL le 2026-10-06.

---

## 2026-10-07 — Trois niveaux de compétence, pas quatre

**Décision.** `UserSkill.level` vaut `BEGINNER`, `INTERMEDIATE` ou `ADVANCED`. Le niveau `EXPERT`, présent dans le premier modèle, est retiré.

**Pourquoi.** Le ticket DL-15 énonce « Niveau BEGINNER/INTERMEDIATE/ADVANCED ». Les tickets font foi pour le périmètre. Quatre niveaux obligeraient en plus l'interface à distinguer « avancé » d'« expert », ce qu'aucune maquette ne demande.

**Coût.** Nul : la migration a été appliquée avant toute donnée réelle.

---

## 2026-10-07 — Une sous-classe de JWTAuthentication pour obtenir des 401

**Décision.** Toutes les vues utilisent `core.authentication.BearerJWTAuthentication` plutôt que `JWTAuthentication` directement.

**Pourquoi.** DRF choisit entre `401` et `403` selon qu'une classe d'authentification sait produire un en-tête `WWW-Authenticate`. Sur une vue publique déclarée avec `authentication_classes = []`, une authentification refusée renvoyait `403`, alors que le contrat d'API annonce `401`. La sous-classe fournit cet en-tête.

Elle est aussi déclarée auprès de drf-spectacular (`core/schema.py`), sinon le schéma OpenAPI est généré avec un avertissement et sans le schéma de sécurité Bearer.

---

## 2026-10-07 — Les champs inconnus sont refusés, non ignorés

**Décision.** `StrictSerializer` (dans `accounts/serializers.py`) rejette en `400` tout champ non déclaré.

**Pourquoi.** Par défaut, DRF ignore silencieusement les champs inconnus. Un client pourrait donc envoyer `{"is_staff": true}` à l'inscription sans erreur. Même si le service n'utilise pas ce champ, un refus explicite vaut mieux qu'un silence : la faute est signalée au développeur, et l'API documente sa propre surface. Couvert par `test_register_rejects_unknown_fields`.

---

## 2026-10-07 — Aucune bibliothèque d'icônes ni de composants

**Décision.** Design system fait par nous : neuf composants dans `frontend/src/components/ui/`, icônes en SVG inline, polices système.

**Pourquoi.** Trois raisons. D'abord la règle des licences : chaque dépendance ajoutée est un risque à vérifier, et une police ou un jeu d'icônes mal licencié rendrait le projet irrecevable. Ensuite la note : le cahier demande un design « sobre et distinctif, pas un modèle générique ». Enfin le poids : le build reste léger, ce qui compte pour des connexions africaines parfois lentes.

`lucide-react` était autorisé par le cahier ; nous ne l'avons pas ajouté, faute de besoin réel.

---

## 2026-10-07 — Renouvellement du jeton dans le client d'API

**Décision.** `lib/api.ts` intercepte un `401`, tente **une seule fois** de renouveler le jeton d'accès, puis rejoue la requête.

**Pourquoi.** Le jeton d'accès dure 30 minutes (choix de sécurité). Sans ce mécanisme, l'utilisateur serait déconnecté toutes les 30 minutes en pleine navigation. La tentative unique évite toute boucle infinie si le jeton de rafraîchissement est lui aussi révoqué ; dans ce cas, la session est effacée et la garde de routes renvoie vers la connexion.

---

## 2026-10-07 — TanStack Query n'est pas ajouté

**Décision.** Les appels passent par `lib/api.ts` et `useState`/`useEffect`, sans bibliothèque de gestion de requêtes.

**Pourquoi.** Le cahier l'autorisait, licence permise. Mais à l'échelle du projet (une quinzaine d'écrans, pas de synchronisation complexe), elle ajouterait une dépendance et un concept de plus à expliquer au jury, qui évalue la maîtrise du code par l'équipe. Si la mise en cache devient un vrai besoin en Phase 2, la décision sera revue ici.

---

## 2026-10-07 — eslint-plugin-jsx-a11y retiré : il tire axe-core (MPL-2.0)

**Décision.** Le plugin `eslint-plugin-jsx-a11y` est retiré. Six règles d'accessibilité maison le remplacent, dans `frontend/eslint-rules/a11y.js`.

**Pourquoi.** Le cahier des charges contient une contradiction : sa section 3 impose `eslint-plugin-jsx-a11y`, alors que sa règle 1 interdit nommément `axe-core` (MPL-2.0). Or le plugin dépend de `axe-core` :

```
eslint-plugin-jsx-a11y@6.10.2
`-- axe-core@4.14.0   (MPL-2.0)
```

Le contrôle des licences a échoué dès l'installation. La règle des licences l'emporte : une licence à réciprocité peut rendre le projet irrecevable, alors qu'un plugin de lint est remplaçable. Une seule règle du plugin (`autocomplete-valid`) utilise réellement `axe-core`, mais le paquet se retrouve malgré tout dans `node_modules` et dans `package-lock.json`, donc le risque subsiste.

**Ce que couvrent nos règles.** Les fautes que nous risquons réellement dans ce projet :

| Règle | Ce qu'elle empêche |
|---|---|
| `img-requires-alt` | Une image sans texte alternatif |
| `anchor-requires-href` | Un `<a>` sans destination, non focusable |
| `target-blank-requires-noopener` | Un lien `_blank` sans `rel="noopener"` (critère de DL-35) |
| `button-requires-type` | Un bouton qui soumet un formulaire par inadvertance |
| `control-requires-label` | Un champ sans nom accessible |
| `clickable-needs-keyboard` | Un `onClick` sur un `<div>`, inutilisable au clavier |

Chaque règle a été vérifiée sur un fichier d'essai contenant les six fautes : toutes sont signalées.

**Ce que nous perdons.** Les règles plus fines du plugin (vérification des attributs ARIA, rôles valides, etc.). Pour compenser, DL-34 prévoit une vérification manuelle de l'accessibilité : navigation entière au clavier et contrastes.

**À signaler à l'équipe** : si l'organisateur répond à DL-10 que la MPL-2.0 est acceptée, cette décision pourra être revue.

---

## 2026-10-08 — Carte de l'Afrique en tuiles, et non en SVG géographique

**Décision.** La carte de DL-37 est une grille de tuiles carrées, une par pays, placées à la main selon leur position approximative sur le continent (`frontend/src/features/countries/components/AfricaTileMap.tsx`).

**Pourquoi.** Le ticket demandait une carte SVG. Nous n'en utilisons pas, pour deux raisons :

1. **La licence.** Les fichiers de contours géographiques disponibles sont presque tous sous une licence à réciprocité, sous licence de données non permissive, ou sans licence claire. Le cahier des charges interdit d'importer la moindre donnée cartographique tierce sans licence permissive déclarée dans `LICENSES.md`. Une carte dessinée par nous supprime le problème.
2. **Le poids.** Un tracé précis de 54 pays pèse plusieurs centaines de kilo-octets. Nos tuiles ne coûtent rien, ce qui compte pour des connexions parfois lentes.

**Ce que nous perdons.** L'exactitude géographique. L'intérêt de cette carte est de donner un repère visuel et de rendre chaque pays cliquable, pas de servir d'atlas : la liste reste l'outil de navigation principal, juste en dessous.

**Conformité au ticket.** Les deux critères d'acceptation sont respectés : la grille fonctionne sur mobile (9 colonnes, aucun débordement) et les pays sans donnée restent gris mais cliquables.

---

## 2026-10-07 — Fonctions d'IA sans SDK ni bibliothèque HTTP

**Décision.** Les appels au service d'IA passent par `urllib`, de la bibliothèque standard Python (`backend/ai/client.py`).

**Pourquoi.** Toutes les solutions habituelles sont écartées par la règle des licences :

| Option | Problème |
|---|---|
| SDK du fournisseur | Dépend de `httpx`, qui dépend de `certifi` (MPL-2.0) |
| `requests` | Dépend de `certifi` (MPL-2.0) |
| `httpx` | Même problème |
| **`urllib`** | **Bibliothèque standard, licence PSF, aucune dépendance** |

`urllib` utilise le magasin de certificats du système d'exploitation, donc nous n'embarquons aucun paquet de certificats. **Zéro dépendance ajoutée pour toute la Phase 4.**

**Le coût.** Il faut écrire à la main la sérialisation JSON, la gestion des délais d'attente et la distinction des erreurs réseau. Cela représente environ 80 lignes, toutes dans un seul fichier, couvertes par des tests.

---

## 2026-10-07 — L'IA propose, l'utilisateur valide

**Décision.** Aucune fonction d'IA n'écrit en base. Chacune renvoie une proposition que l'utilisateur accepte par un clic.

**Pourquoi.** Trois raisons, dans l'ordre d'importance :

1. **La confiance.** Un profil rempli automatiquement, sans contrôle, est un profil dont l'utilisateur ne répond plus. Or tout le produit repose sur la fiabilité des compétences déclarées.
2. **Le règlement.** Les critères d'acceptation de DL-44 et DL-46 l'exigent explicitement : « rien n'est enregistré sans validation », « le propriétaire valide le résumé ».
3. **La réversibilité.** Si le service se trompe, il n'y a rien à défaire.

**Garde-fou supplémentaire** : les suggestions sont contraintes au catalogue de compétences et aux énumérations du contrat d'API. Une valeur inventée par le modèle est écartée en silence, plutôt que de provoquer une erreur à l'enregistrement. Des tests le vérifient avec des valeurs volontairement absurdes (« COBOL », « Wakanda », « GURU »).

---

## 2026-10-07 — L'IA est désactivée par défaut

**Décision.** `AI_ENABLED=False` est le défaut. Sans clé d'API, le produit fonctionne entièrement.

**Pourquoi.** Le cahier des charges est catégorique : « les fonctions principales ne doivent **jamais** dépendre de l'IA ». Concrètement :

- Les composants d'IA de l'interface **ne s'affichent pas** quand le service est inactif : nous ne proposons jamais un bouton qui échouera.
- Chaque route d'IA répond `503` avec le code `ai_unavailable`, et l'interface explique calmement que le formulaire classique reste disponible.
- Un test vérifie, route par route, que le reste du produit est intact avec l'IA coupée.

**Pour l'activer**, il suffit de renseigner `AI_ENABLED=True` et `AI_API_KEY` dans l'environnement. La clé n'est jamais dans le dépôt, et un test vérifie qu'elle part en en-tête HTTP, pas dans le corps de la requête.

**Pour la démonstration devant le jury** : le parcours des huit étapes ne passe par aucune fonction d'IA. Elles sont un complément, montrable si la clé est en place, parfaitement omissible sinon.


---

## 2026-10-07 — Identité visuelle dessinée par nous

**Décision.** Logo, favicon, 30 icônes et 3 motifs d'arrière-plan, tous écrits à la main en SVG. Aucune bibliothèque d'icônes, aucune image bitmap, aucune police chargée.

**Le symbole.** Deux anneaux qui se recouvrent, et leur intersection comme troisième forme. C'est l'idée exacte du produit : la complémentarité réciproque, ni l'un ni l'autre seul, mais ce qu'ils produisent ensemble.

Nous avons écarté les clichés visuels sur l'Afrique (acacia, contour du continent, masque). Un cliché dit « Afrique » mais ne dit rien du produit, et vieillit mal. Une forme géométrique abstraite reste lisible à 16 pixels, se décline en monochrome, et ne ressemble à aucun logo existant.

**Trois essais pour l'icône `match`.** C'est l'icône du cœur du produit, donc celle qui méritait le plus de travail :

1. Deux formes qui s'emboîtent par des arcs — illisible, les arcs se replient sur eux-mêmes.
2. Deux pièces de puzzle — illisible à 20 px, trop de détails.
3. **Deux cercles qui se croisent** — retenue : se lit immédiatement, à toutes les tailles.

C'est la leçon du travail d'icône : la densité est l'ennemie de la lisibilité. Une forme simple bien cadrée vaut mieux qu'une métaphore riche illisible.

**La cohérence du jeu** vient d'une discipline, pas du talent de chaque dessin : même grille de 24 unités, même trait de 1,75, mêmes extrémités arrondies, et une marge optique de 2 unités sur chaque bord. Deux tests automatiques le vérifient : aucune coordonnée absolue hors de la grille, et aucun remplissage dans les tracés.

**Les motifs d'arrière-plan** sont volontairement presque invisibles (opacité de 0,06 à 0,10). Un fond qui se remarque nuit au texte posé dessus. Un test vérifie que l'opacité ne dépasse jamais 0,15.

**Pourquoi pas un générateur d'images.** Trois raisons. La licence : les images produites par un modèle génératif sont un terrain juridique flou, et l'article 6 interdit tout composant sans licence claire. Le format : du SVG écrit à la main est du code source, donc couvert par l'originalité du projet. Le poids : nos 30 icônes ajoutent 4 ko au build, là où un jeu d'images en pèserait plusieurs centaines.

---

## 2026-10-07 — Photo de bannière générée par IA sur la page d'accueil

**Décision.** La bannière de la page d'accueil (`frontend/src/pages/HomePage.tsx`) utilise désormais une photo (`frontend/src/assets/images/hero-background.jpg`) en fond, à la place du motif `RingsPattern` dessiné par nous, sur demande explicite et répétée d'Achraf après une démonstration visuelle.

Ceci **nuance la décision du dessus**, qui écartait justement les images génératives pour des raisons de licence. Les deux raisons qui tenaient toujours (le poids, le format non-code) ne s'appliquent pas à une bannière décorative plein écran, où un motif SVG répétable atteint ses limites esthétiques. Reste la question de la licence, qu'il fallait donc traiter sérieusement plutôt qu'ignorer.

**Origine du fichier.** Achraf a d'abord transmis un fichier `OIP.webp` de son dossier Téléchargements — nom caractéristique d'un téléchargement automatique depuis un moteur de recherche d'images (Bing Images), dont l'origine et la licence réelle sont invérifiables. Ce fichier a été refusé : impossible de documenter une licence qu'on ne connaît pas, article 6 oblige.

En examinant le dossier Téléchargements par date de modification, un second fichier plus récent est apparu : `Gemini_Generated_Image_7jxrqa7jxrqa7jxr.jpeg`, visuellement identique (même dégradé crème → terre cuite → sombre), mais généré par Google Gemini plutôt que récupéré sur un moteur de recherche. C'est ce second fichier qui a été intégré.

**Pourquoi cette distinction compte.** Une image générée par un modèle d'IA n'a pas d'auteur tiers identifiable à enfreindre (ni photographe, ni banque d'images, ni artiste) : c'est un dégradé abstrait sans sujet figuratif. Les conditions d'utilisation de Google accordent à l'utilisateur les droits d'usage sur ce qu'il génère. Une image scrapée depuis un moteur de recherche, à l'inverse, peut provenir de n'importe qui, sous n'importe quelle licence, sans que rien ne le dise. La première est documentable ; la seconde ne l'est pas.

**Ce qui a été fait, concrètement :**
- Fichier copié depuis `~/Downloads/`, recompressé avec `sips` (outil natif macOS, qualité 78) : 345 ko → 56 ko, sans dépendance ajoutée (`sharp` reste interdit par nos propres règles de licence).
- Contraste vérifié par échantillonnage réel des pixels de l'image (Pillow, dix bandes de hauteur) : le texte sombre ne passe la norme AA que dans le tiers supérieur, le texte blanc ne la passe que dans la moitié inférieure. Aucune couleur de texte ne fonctionne sur toute l'image.
- Solution retenue initialement : un panneau quasi opaque et flouté (`bg-white/90 backdrop-blur-sm`) derrière le bloc de texte. Remplacé le même jour par un voile sombre uniforme sur toute la bannière — voir l'entrée du dessous, qui explique pourquoi.
- Déclaré dans `LICENSES.md` (section éléments graphiques) et dans `AI_USAGE.md` (art. 6, toute partie du projet produite par IA doit être journalisée).

**Limite assumée.** Ce n'est pas une licence au sens classique (MIT, BSD, etc.), parce qu'une image générative n'en a pas. C'est un choix documenté et traçable, qui peut être expliqué et défendu devant le jury — ce que ne permettait pas le fichier `OIP.webp` d'origine inconnue.

---

## 2026-10-07 — Bannière recentrée, grilles élargies : la plateforme n'utilisait pas tout l'écran

**Décision.** Deux problèmes de mise en page distincts, remontés par Achraf sur une capture d'écran à grande largeur, corrigés ensemble.

**Premier problème : les pages à grille (recherche, pays, projets, matchs, tableau de bord) plafonnaient à `max-w-6xl` (1152 px).** Sur un écran de 1920 px, ça laisse environ 380 px de vide de chaque côté et les grilles de cartes n'allaient jamais au-delà de 3 à 4 colonnes, quelle que soit la largeur disponible — capturé par une comparaison avant/après avec Playwright en local (outil de diagnostic, non ajouté aux dépendances du projet, comme `reportlab` avant lui).

Plutôt qu'élargir `PageContainer` pour tout le monde (ce qui aurait rendu les pages de lecture — formulaires, détail d'un projet ou d'un match — inutilement larges), deux largeurs cohabitent désormais :
- `PageContainer` (défaut, `max-w-7xl`) pour tout ce qui se lit : formulaires, pages de détail, page d'accueil.
- `PageContainer size="wide"` (`max-w-[90rem]`, ≈1440 px), posé par un nouvel enrobage de route `WidePage.tsx`, pour les écrans à grille dense.

Les grilles elles-mêmes gagnent des paliers (`xl:`, `2xl:`) pour profiter de cette largeur : les cartes de recherche passent de 3 à 4 colonnes, les tuiles de pays de 4 à 6.

**Second problème : la bannière d'accueil ne remplissait pas le ressenti d'un site professionnel.** Le contenu était cantonné dans un panneau clair en haut à gauche de la photo. Sur le modèle demandé par Achraf (page d'une autre compétition, CADev 2026 de Systalink), le texte est centré directement sur l'image pleine largeur, avec des éléments décoratifs flottants.

Repris avec nos propres codes, pas une copie : un voile sombre uniforme (`bg-ink-900/65`) remplace le panneau clair — vérifié par échantillonnage réel des pixels de l'image sur dix bandes de hauteur, il garantit au moins 5:1 de contraste pour chaque couleur de texte utilisée, sur toute la hauteur de l'image (voir l'entrée du dessus pour l'origine de l'image). Le titre et le texte sont centrés. Quatre pastilles flottantes reprennent nos propres icônes et les quatre types d'échange du produit (mentorat, revue de code, pair programming, projet commun) — pas de logos ou d'autocollants empruntés à qui que ce soit.

**Un bug trouvé en testant le responsive, pas seulement l'écran large.** Les pastilles flottantes étaient prévues à partir de `md:` (768 px). À cette largeur et jusqu'à `lg` (1024 px), le texte centré est déjà large (`max-w-3xl`) et ne laisse qu'une centaine de pixels de chaque côté — trop étroit pour une pastille d'environ 170 px, qui chevauchait alors le titre. Calcul refait pour trouver le seuil réel (le vide latéral ne dépasse la largeur d'une pastille qu'à partir d'environ 1216 px) : seuil remonté à `xl:` (1280 px). Sur mobile et tablette, les pastilles restent simplement masquées — c'est la ligne de texte sous les boutons (mêmes quatre libellés, sans décor) qui porte l'information à ces tailles.

**Pourquoi ne pas avoir pris des chiffres réels en repère de crédibilité** (le site de référence affiche « +50 000 participants attendus »). Nos seules données sont les profils de démonstration (`seed_demo`), explicitement marqués comme tels sur chaque carte. Les présenter comme un indicateur d'usage réel aurait été trompeur sur un projet noté. La bannière s'en tient donc aux quatre types d'échange, une information vraie et vérifiable par n'importe qui sur le produit lui-même.

---

## 2026-10-07 — Project Hub : un vrai lien vers le dépôt, pas un hébergement de code

**Demande d'Achraf.** « Je veux comme GitHub et GitLab, les gens peuvent mettre leur projet et le modifier, un emplacement réel pour leurs projets. »

**Ce qui existait déjà.** Le modèle `Project` a toujours eu `repo_url` et `demo_url` (DL-16/17), et la création/modification d'un projet fonctionnait déjà de bout en bout (`ProjectFormPage`, CRUD complet côté API). Le problème n'était donc pas fonctionnel : c'était que les cartes et la page de détail ne montraient presque rien de ce lien, et que les données de démonstration n'en avaient aucun — un projet avait l'air d'une fiche passive, pas d'un vrai dépôt qu'on consulte.

**Ce que nous n'avons pas fait : héberger du code.** Reproduire GitHub/GitLab — stockage Git, navigateur de fichiers, commits, branches — est un produit à part entière, sans rapport avec le nôtre (un outil de mise en relation par compétences) ni avec le temps disponible avant la soutenance. Ça aurait aussi tout changé à l'architecture déjà construite et testée. DevLink Africa **renvoie** vers le vrai dépôt (GitHub, GitLab, ailleurs) plutôt que de le remplacer — comme le fait la quasi-totalité des plateformes de ce genre (Product Hunt, Devpost) : montrer le projet, pas l'héberger.

**Ce que nous avons fait : que ce lien soit réel et visible.**
- Carte de projet : icône, lien du dépôt affiché en clair (`github.com/org/projet`, raccourci avec `shortenUrl`), date de dernière mise à jour.
- Page de détail : « Dépôt du code » et « Démonstration en ligne » promus en boutons bien visibles à côté de Modifier/Supprimer, plutôt qu'en liens discrets enterrés en bas de page ; ligne de métadonnées (création, mise à jour, compteurs).
- Vérifié de bout en bout en conditions réelles (pas seulement en lisant le code) : connexion avec un compte de démonstration, modification d'un projet existant avec une vraie URL GitHub, et re-consultation de la carte et de la page de détail pour confirmer l'affichage.

**Pourquoi aucune URL de dépôt n'est ajoutée aux projets de démonstration dans `seed_demo`.** Inventer des adresses GitHub plausibles mais fictives aurait affiché des liens morts (page 404) au moindre clic pendant une démonstration — un détail qui se remarque. Le champ reste vide pour ces projets, comme avant ; la fonctionnalité se prouve en l'utilisant (ci-dessus), pas en la simulant avec de fausses données.

---

## 2026-10-07 — Retour en arrière sur la bannière photo : design blanc partout

**Décision.** La bannière photo sur fond sombre (entrée du dessus) est retirée le jour même de sa mise en place. Achraf : « j'ai pas aimé la couleur marron », « je veux un design blanc ». Le fichier `hero-background.jpg` est supprimé du dépôt (plus aucune référence dans le code), et la bannière revient à un fond blanc, cohérent avec le reste du site.

**Pourquoi ce n'est pas vu comme du travail perdu.** Le reste de ce qui avait été construit avec la photo tient sans elle : mise en page centrée, pastilles flottantes avec nos icônes, mot clé en couleur, bouton d'action — tout ça reste, seules les couleurs changent (texte sombre sur blanc plutôt que texte blanc sur fond sombre). C'est la même leçon que les trois essais de l'icône `match` ou le premier panneau clair en coin de bannière : le jugement visuel se fait en le voyant construit, pas en l'imaginant à l'avance, et le reconstruire une fois de plus ne coûte presque rien grâce aux pièces déjà en place (`PageContainer`, les icônes, `Button`).

**Traçabilité.** `LICENSES.md` ne liste plus cette image (elle n'est plus dans le dépôt). `AI_USAGE.md` garde la ligne du 2026-10-07 avec une mention du retrait le jour même : la règle 3 du concours demande de déclarer tout usage d'IA, y compris celui qui n'a pas survécu à la relecture visuelle.

---

## 2026-10-07 — Correction : la photo revient, mais en clair (pas retirée)

**Malentendu, corrigé le jour même.** « Design blanc » a été compris comme « retirer la photo ». Ce n'était pas ça : Achraf voulait garder la photo qu'il avait envoyée, seulement dans des teintes claires — c'est le voile **sombre** (bg-ink-900/65, entrée du 2026-10-07 plus haut) qui posait problème, pas la photo elle-même.

**Correction.** La photo (`hero-background.jpg`, retirée puis restaurée depuis l'historique Git) revient en fond de bannière, mais sous un voile **blanc** (`bg-white/75`) plutôt que sombre : celui-ci éclaircit l'image au lieu de l'assombrir, y compris sa bande la plus sombre en bas. Revérifié par le même échantillonnage de pixels que la première fois : le contraste du texte sombre reste au-delà de 9:1 sur toute la hauteur (largement au-dessus du minimum AA de 4,5:1), avec une marge bien plus confortable qu'avec le voile sombre d'origine.

**Leçon.** « Design blanc » peut vouloir dire « que du blanc » ou « des teintes claires » — deux choses différentes. Dans le doute sur un changement déjà fait une fois dans le mauvais sens, la bonne réaction est de redemander plutôt que de supposer que la seconde tentative confirme la première lecture.

---

## 2026-10-07 — Petite reprise visuelle du Project Hub

**Décision.** Le style des cartes et de la page de détail d'un projet ne plaisait pas à Achraf (sans détail précis donné). Plutôt que de deviner un seul point, reprise de l'ensemble avec un regard de design :

- L'icône de dossier était dans un carré gris (`bg-ink-100`), terne et sans rapport avec le reste de l'identité visuelle qui n'utilise que la teinte terre cuite de la marque. Passée en `bg-accent-50` / `text-accent-600`, comme les badges « Étape » de l'accueil.
- La ligne de séparation (`border-t`) avant le pied de carte (porteur, date) retirée : aucune autre carte du produit n'en a, et elle alourdissait la carte sans information supplémentaire.
- `Card` gagne une prop `interactive` (légère élévation de l'ombre au survol) — pas seulement pour les projets : posée aussi sur les cartes de match, de pays et de résultat de recherche, qui mènent toutes à une page de détail mais ne le signalaient visuellement que par un lien textuel. Cohérence voulue : une carte qui mène quelque part réagit au survol, une carte qui ne mène nulle part (une carte d'échange, par exemple) n'y réagit pas.

---

## 2026-10-08 — Thème sombre façon GitHub, sur tout le site

**Décision.** Achraf a demandé un thème sombre « façon GitHub » pour l'ensemble du site, après avoir vu une capture de VS Code en sombre. Deux questions posées avant de commencer, vu l'ampleur du changement et le fait que la toute dernière demande en date (un design plus clair) allait dans le sens inverse :

1. Thème sombre partout, ou un interrupteur clair/sombre ? → **Sombre partout**, pas d'interrupteur.
2. Garder l'accent terre cuite de la marque sur fond sombre, ou adopter un accent façon GitHub (bleu) ? → **Bleu façon GitHub**, quitte à détacher le logo de son ancienne couleur.

**Ce qui change, mécaniquement.** `ink` (les gris) et `accent` (la couleur de marque) sont les deux seuls jetons de couleur utilisés dans tout le code (43 fichiers) — aucune couleur n'est jamais écrite en dur dans un composant. Ça a permis de retourner tout le site en changeant un seul fichier, `tailwind.config.js` :

- `ink` est **inversé** : la valeur `50` est maintenant le fond le plus sombre (la page), la valeur `900` le texte le plus clair. Comme toutes les classes `bg-ink-50`/`text-ink-900` du code expriment déjà « un fond » ou « un texte lisible » sans dire quelle teinte concrète, l'inversion suffit : aucun composant n'a eu besoin d'être touché pour ce point.
- `accent` (bleu) est construit en **deux familles**, et c'est le seul endroit où une teinte physique a dû changer de rôle plutôt que de simplement s'inverser : calcul fait (voir plus bas), une seule valeur ne peut pas à la fois servir de fond de bouton (doit rester assez sombre pour porter du texte blanc) et de texte de lien sur fond presque noir (doit être assez claire) — l'écart entre les deux besoins est trop grand, confirmé par le calcul de contraste, pas par une impression. `accent-50` à `accent-300` restent sombres (fonds de bouton, encadrés), `accent-400` à `accent-900` sont des bleus clairs (texte, icônes, liens).

**Deux pièges que l'inversion, à elle seule, ne couvrait pas :**
- Plusieurs endroits utilisaient `ink-900` ou `ink-300` comme **une couleur sombre en soi** plutôt que comme « le texte le plus lisible » — par exemple le voile derrière une fenêtre modale (`bg-ink-900/40`, pensé pour assombrir), qui serait devenu un voile presque blanc après inversion. Corrigé en `bg-black/60`, une couleur qui ne dépend d'aucun thème.
- Plusieurs survols (`hover:bg-ink-100`) menaient exactement à la même teinte que le fond de la carte qui les contenait (`bg-ink-100` aussi, après le passage de `bg-white` à `bg-ink-100` pour tous les fonds de carte) : un survol invisible. Remonté d'un cran, `hover:bg-ink-200`, partout où ça se produisait (en-tête, pied de page, bouton secondaire, bouton discret, fenêtre modale).

**Calcul de contraste, pas estimation visuelle.** Comme pour chaque jeton de couleur de ce projet, chaque paire texte/fond a été vérifiée par la formule de contraste WCAG réelle avant d'écrire la moindre classe : les dix paliers de `ink` contre les fonds de page et de carte, les deux familles d'`accent` entre elles et contre ces mêmes fonds, le bleu du bouton principal avec du texte blanc dessus, et les couleurs de statut (rouge, vert, ambre, bleu ciel) de Tailwind réassorties en paires sombres (`bg-{couleur}-950/50` + `text-{couleur}-300`, inspirées des encadrés d'information de GitHub) plutôt que les paires claires (`bg-{couleur}-50` + `text-{couleur}-800`) d'origine. Tout passe largement au-dessus du minimum AA (4,5:1) — la plupart des paires de texte dépassent 6:1.

**La photo de bannière ne pouvait pas survivre à ce changement.** Son dégradé (crème en haut, marron/sombre en bas) jurait avec un thème entièrement bleu-gris. Retirée pour de bon (voir l'entrée du dessus) ; la bannière revient à un fond de page uni, sans grand visuel — c'est aussi ce que fait l'écran d'accueil connecté de GitHub, le modèle demandé : le contenu et la mise en page font le travail, pas une image.

**Logo, favicon, motifs : mêmes formes, nouvelles couleurs.** Ces fichiers dessinent des SVG avec des couleurs écrites en dur (pas de classes Tailwind, techniquement impossible pour l'attribut `stroke`) : `Logo.tsx`, `favicon.svg` et `Patterns.tsx` ont donc été corrigés à la main, en reprenant exactement les valeurs hexadécimales du nouveau `accent-600` et `ink-900`, pour rester cohérents avec le reste du thème sans dépendre d'un fichier de configuration qu'un SVG ne peut pas lire.

**Vérifié dans le vrai navigateur, page par page**, pas seulement en relisant le code : connexion, inscription, recherche, projets, pays, tableau de bord, profil, matchs, compétences, échanges, formulaire de projet, détail d'un projet, page de confidentialité et la page `/design` elle-même (qui sert justement à ce genre de relecture). Un oubli a été trouvé ainsi et corrigé : le serveur de développement Vite ne relit pas `tailwind.config.js` à chaud, il a fallu le redémarrer pour voir les nouvelles couleurs — sans ça, les captures d'écran auraient montré l'ancien thème malgré un code déjà correct.

---

## 2026-10-08 — Boutons principaux en vert, comme sur GitHub

**Décision.** Sur demande d'Achraf (« vert comme GitHub mais pas trop vert »), le bouton `primary` (`Créer mon compte`, `Se connecter`, etc.) passe du bleu de marque à un vert. C'est fidèle à GitHub, qui distingue déjà ses deux accents : le bleu pour les liens et le focus, le vert pour l'action principale d'un bouton (leur bouton « Code », entre autres). Les autres usages du bleu (logo, liens, onglets actifs, tuiles de pays, barres de score) ne changent pas : seul `Button` variant `primary` est concerné.

**La teinte.** `green-700` de Tailwind (`#15803d`) au repos, `green-800` (plus sombre) au survol — vérifié à 5:1 avec du texte blanc dessus, et encore mieux au survol. Choisi plutôt que le vert exact de GitHub (`#238636`, qui ne passait qu'à 4,1:1 au repos) pour garder la même marge de sécurité que le reste de la palette. Couleur Tailwind de base, sans ajout au fichier de configuration : même logique que le bouton `danger`, qui utilisait déjà un rouge Tailwind brut plutôt qu'un jeton `ink`/`accent`.

---

## 2026-10-08 — Navbar flottante, page d'accueil enrichie, effets bleus sur tout le site

**Navbar.** Pastille claire arrondie qui flotte au-dessus du fond sombre et reste collée en haut au défilement : logo à gauche, liens centrés, « Se connecter » et un bouton bleu « S’inscrire » à droite. Le logo a une variante `light` (anneau droit quasi noir) pour rester lisible sur ce fond clair. Connecté, la barre porte sept liens plus le profil : elle ne passe sur une ligne qu'à partir de 1280 px, donc le menu complet s'affiche à `xl` (contre `lg` pour un visiteur, qui n'a que trois liens) ; vérifié par capture à 1024, 1280 et 1440 px.

**Le bouton principal repasse en bleu.** Il remplace le vert de l'entrée précédente : la navbar et l'accueil utilisent un bleu lumineux, et deux couleurs d'action différentes d'une page à l'autre donnaient une impression de patchwork. `#1f6feb` porte du blanc à 4,6:1 ; au survol on fonce (`#1a5fd0`) au lieu d'éclaircir, pour ne pas descendre sous 4,5:1.

**Effets façon github.com, factorisés.** Grille estompée (`.bg-grid`), halos flous (`.glow-blob`), texte en dégradé (`.text-gradient`), cartes à bordure lumineuse (`.glow-card`) dans `index.css` ; ombres `glow` et `glow-soft` dans `tailwind.config.js`. Les pages intérieures passent toutes par `PageShell`, qui pose la grille et un halo discret en haut de page et rejoue une courte animation d'entrée à chaque changement d'adresse.

**Animations sans risque pour l'accessibilité.** Les apparitions au défilement (`useReveal`) partent d'un contenu visible si `IntersectionObserver` manque, et la règle `prefers-reduced-motion` coupe aussi les animations en boucle (`animation-iteration-count: 1`), sinon une boucle réduite à 0,01 ms aurait clignoté.

**Piège rencontré.** Un halo centré par `-translate-x-1/2` partait sur le côté : l'animation `glow` pose son propre `transform` et écrase la translation. Les halos sont donc centrés par `inset-x-0 mx-auto`.

**Chiffres de l'accueil.** Tous viennent du produit : 54 pays (carte), 6 critères et l'exemple de score à 82,5 (docs/api.md), 4 formes d'échange. Aucun chiffre d'usage inventé.

---

## 2026-10-08 — Sortir des « boîtes » : surfaces douces, ronds, avatars

**Constat.** Après la refonte bleue, Achraf trouvait le site « fait de carrés » : chaque contenu était enfermé dans un rectangle gris à bordure, sur une grille de fond qui dessinait elle-même des carrés, et la carte de l'Afrique était une grille de tuiles carrées.

**Ce qui change.**
- **Surface au lieu de boîte.** `Card` n'a plus de bordure grise ni d'ombre lourde : un voile translucide légèrement plus clair en haut, un liseré intérieur presque invisible, et un arrondi de 24 px au lieu de 12 (classe `.surface` dans `index.css`). Comme presque tous les écrans passent par `Card`, le changement se propage partout sans toucher aux pages.
- **Plus de grille de fond.** Remplacée par une « aurore » : deux lueurs radiales bleue et violette, sans aucune ligne.
- **Formes rondes.** Boutons en pilule, champs de saisie arrondis et translucides, pays affichés en pastilles avec leur drapeau, carte de l'Afrique en points au lieu de tuiles, score d'un match en jauge circulaire (`ScoreRing`).
- **Des visages plutôt que des cadres.** `Avatar` affiche les initiales sur un dégradé dont la teinte dépend du nom (stable d'une page à l'autre). Il apparaît partout où une personne est listée : matchs, tableau de bord, recherche, pays, échanges, profils.
- **Accueil et tableau de bord ouverts.** Les sections de l'accueil ne sont plus des grilles de cartes mais des colonnes libres, avec une icône ronde en dégradé ; les compteurs du tableau de bord sont posés à plat, séparés par un trait fin.

**Accessibilité conservée.** L'avatar est décoratif (`aria-hidden`), le nom étant toujours écrit à côté. La jauge porte une étiquette (« Score de 83 sur 100 ») et garde le chiffre en texte réel au centre.

---

## 2026-10-08 — Le contact se débloque à l'acceptation d'un échange

**Problème.** Accepter un échange ne débloquait rien : l'adresse e-mail n'est jamais publique, et aucune autre information de contact n'existait. La boucle « match → échange » s'arrêtait donc juste avant l'essentiel, alors que `EXPLICATION_JURY.md` affirmait le contraire.

**Choix.** Un champ `contact` facultatif dans le profil, que chacun remplit avec ce qu'il veut bien partager : une adresse e-mail ou un lien `https` (GitHub, LinkedIn…). Il n'est **jamais** dans le profil public. Il apparaît sur un échange, pour les deux participants, uniquement quand celui-ci est `ACCEPTED` ou `COMPLETED` : c'est l'acceptation qui vaut accord pour être joint. Un échange refusé ou annulé ne révèle rien.

**Pourquoi pas l'adresse de connexion.** La politique de confidentialité promet qu'elle n'est jamais montrée : la révéler aurait changé ce à quoi les utilisateurs ont consenti. Et beaucoup préfèrent être joints ailleurs que sur leur e-mail de connexion.

**Pourquoi pas une messagerie interne.** Modération, notifications, stockage de conversations privées : beaucoup de données personnelles en plus, pour un service que les développeurs ont déjà.

**Pourquoi pas du texte libre (« Telegram @ada »).** L'interface en fait un lien cliquable : n'accepter qu'un e-mail ou une URL `https` écarte par construction `javascript:` et le reste. Contrôle côté serveur, revérifié côté interface.

**Performance.** Le contact vient du profil : les échanges sont chargés avec `select_related("requester__profile", "partner__profile")`, et un test vérifie que lister des échanges acceptés ne fait pas une requête par ligne.

---

## 2026-10-08 — Test du parcours dans un vrai navigateur

**Pourquoi.** Le test de bout en bout existant passait par l'API : il ne voyait ni un bouton mal nommé, ni une page qui plante au rendu. Or c'est l'interface que le jury regarde.

**Comment.** `e2e/tests/parcours-demo.spec.ts`, avec Playwright, rejoue `docs/demo.md` dans Chromium : inscription, profil, compétences, Mamadou Bâ en tête des matchs, score expliqué, demande, acceptation dans un second navigateur, contact révélé des deux côtés, demande pour rejoindre un projet. Playwright démarre lui-même un backend sur une base SQLite jetable (`scripts/e2e_backend.sh`) et le serveur Vite.

**Licence.** `@playwright/test` est sous Apache-2.0, ses deux dépendances aussi ; le dossier `e2e/` est analysé par le même contrôle de licences que le reste. Il est **séparé** du frontend : rien n'entre dans le build ni dans le livrable. Le navigateur Chromium est téléchargé à l'exécution, comme celui de n'importe quel utilisateur, et n'est pas une dépendance du projet (voir `LICENSES.md`). Jusqu'ici, Playwright n'avait servi qu'en local pour des captures ; il devient un outil de test versionné, ce qui mérite cette entrée.

---

## 2026-10-08 — Un compteur faux sur le tableau de bord

`pending_exchanges.received` et `sent` étaient calculés en comptant les éléments de l'aperçu, limité à 5. Avec 7 demandes reçues, le tableau de bord en annonçait 5. Ils sont désormais comptés en base par une requête d'agrégat (une requête de plus, nombre total toujours constant quel que soit le volume, vérifié par le test existant). Trouvé en ajoutant les champs des premiers pas.

---

## 2026-10-08 — Connexion avec Google

**Décision.** Ajout de « Continuer avec Google » à l'inscription et à la connexion, sur demande d'Achraf. Même principe que les fonctions d'IA : **désactivé par défaut**, invisible côté interface tant qu'aucun identifiant n'est configuré, et le produit fonctionne entièrement sans — ce n'est pas la seule porte d'entrée.

**Ce que je ne peux pas faire moi-même.** Activer réellement ce bouton demande un identifiant client OAuth, obtenu sur [Google Cloud Console](https://console.cloud.google.com/) : créer un projet, configurer l'écran de consentement, créer un identifiant « OAuth 2.0 » de type « Application Web », et y déclarer les origines autorisées (`http://localhost:5173` en développement, le domaine réel une fois déployé). Ça suppose un compte Google et d'accepter leurs conditions au nom du projet — une démarche humaine, pas quelque chose que je dois faire à la place d'Achraf. Une fois l'identifiant obtenu, il suffit de le coller dans `backend/.env` (`GOOGLE_CLIENT_ID=...`) : le bouton apparaît alors de lui-même, aucun redéploiement de code nécessaire.

**Vérification du jeton, sans `requests`.** La bibliothèque `google-auth` (Apache-2.0, licences de ses dépendances toutes vérifiées : MIT, BSD) sait vérifier un jeton d'identité Google, mais la plupart des exemples s'appuient sur `google.auth.transport.requests`, qui tire `requests` puis `certifi` (MPL-2.0, interdite par le règlement). `accounts/google_auth.py` fournit donc son propre petit adaptateur HTTP basé sur `urllib`, exactement sur le modèle de `ai/client.py` pour les appels au service d'IA : même contrainte, même solution, déjà éprouvée dans ce projet.

**Pourquoi un compte Google peut se connecter à un compte déjà créé par mot de passe.** Google garantit qu'une adresse est vérifiée (`email_verified`) avant de nous la transmettre : si quelqu'un a déjà un compte par mot de passe sur cette adresse, on peut donc s'y connecter en toute confiance via Google plutôt que de créer un doublon. Le mot de passe existant n'est jamais touché. Un compte créé pour la première fois par Google, lui, n'a pas de mot de passe utilisable (`set_unusable_password`, mécanisme standard de Django) tant que la personne n'en choisit pas un depuis son profil.

**Le consentement RGPD-like (loi n° 2008-12).** L'inscription par mot de passe impose une case à cocher explicite. Reproduire exactement ce mécanisme pour un bouton Google est impossible proprement : cliquer sur le bouton déclenche directement la fenêtre de connexion de Google, on ne peut pas intercepter ce clic pour vérifier une case au préalable. Solution retenue, standard sur la quasi-totalité des sites qui proposent une connexion sociale (GitHub et Google y compris) : un texte, « En continuant, vous acceptez notre politique de confidentialité », avec un lien, affiché juste au-dessus du bouton. Le clic qui suit est l'acte explicite ; c'était déjà, de fait, comment la case à cocher elle-même fonctionnait.

---

## 2026-10-08 — DevLink Copilot

**Décision.** Ajout d'un assistant conversationnel intégré (bulle flottante, en bas à droite), sur demande d'Achraf : « DevLink Copilot qui peut aider les développeurs ». Même famille que les autres fonctions d'IA du projet (DL-43 à DL-47), mais c'est la première qui tient une vraie conversation plutôt qu'un aller-retour unique.

**Un assistant produit, pas un assistant généraliste.** L'invite système (`ai/services.py:COPILOT_SYSTEM_PROMPT`) décrit précisément ce que fait DevLink Africa et limite le rôle de Copilot à expliquer et orienter dans la plateforme — profil, compétences, Dev Match, échanges, projets. Elle lui dit explicitement de refuser poliment toute question hors sujet plutôt que d'y répondre. Sans ce garde-fou, un champ de texte libre relié à un modèle de langage devient vite un détournement classique (« fais autre chose pour moi », prompt injection) : mieux vaut le prévenir dans l'invite que le découvrir après coup. Elle lui interdit aussi explicitement de redemander une donnée personnelle (mot de passe, e-mail), en écho à la règle déjà suivie par tout `ai/client.py`.

**Aucune conversation stockée côté serveur.** Chaque appel est indépendant : l'historique (jusqu'à six échanges) est renvoyé par le navigateur à chaque message, jamais conservé en base. Plus simple que de modéliser une conversation persistante, et ça évite une nouvelle catégorie de donnée personnelle à documenter dans `docs/securite.md` et `PrivacyPage.tsx` pour une fonctionnalité qui n'en a pas besoin pour être utile.

**Pourquoi il ne fait rien à la place de l'utilisateur.** Comme `extract_skills` ou `summarize_project`, Copilot explique, il n'agit jamais lui-même (pas d'appel caché à `/me/skills/` ou `/me/`, par exemple) : c'est le même principe que tout le reste de la couche IA du projet, « l'IA propose, l'utilisateur valide » — ici, « l'IA explique, l'utilisateur agit ».

**Visible seulement connecté.** Les autres fonctions d'IA exigent déjà une session (`IsAuthenticated`) ; Copilot suit la même règle plutôt que d'ouvrir un point d'entrée texte-libre-vers-modèle-de-langage à des visiteurs anonymes, qui serait un vecteur d'abus évident (coût, spam) et moins protégé par la limite de débit que ne l'est un compte (`UserRateThrottle` par personne contre `AnonRateThrottle` par IP).

---

## 2026-10-08 — Bouton Google : repositionné, pleine largeur

**Décision.** Achraf a obtenu un vrai identifiant client Google Cloud Console et l'a testé : le bouton apparaissait en haut du formulaire, dans sa taille par défaut (assez étroite). Demande : le mettre en bas, avec « un très très bon design ». Deux changements :

1. **Position** : le bouton passe après le bouton principal (« Se connecter » / « Créer mon compte »), toujours séparé par un repère « ou ». Le mot de passe reste le chemin principal, Google une alternative en dessous — plus conforme à l'ordre dans lequel les champs se remplissent, et au fait que le mot de passe reste la méthode qui fonctionne pour tout le monde (Google ne l'est que pour qui a un compte Google).
2. **Largeur** : Google Identity Services ne dessine pas un bouton qui épouse son conteneur — il faut lui donner une largeur en pixels, qu'il ne met pas à jour tout seul si la fenêtre change de taille. `GoogleSignInButton` mesure maintenant son conteneur (`ResizeObserver`) et redessine le bouton à la largeur exacte de la carte, jusqu'à 400 px (le maximum que Google accepte) — il occupe donc toute la largeur du formulaire, comme n'importe lequel de nos champs, et reste correct si la fenêtre est redimensionnée. Thème changé pour `outline` / forme `pill` (un bouton blanc, bords arrondis) : plus net sur nos fonds sombres que le thème `filled_black` essayé en premier, qui se fondait trop dans la carte.

---

## 2026-10-09 — Ce qui distingue DevLink : quatre ajouts

**Contexte.** Tous les candidats du concours partent du même sujet (mettre en relation des développeurs africains par compétences). Achraf a demandé « quelque chose qui va nous distinguer » et a retenu quatre propositions : cercles d'échange, observatoire des compétences, compétences validées par les pairs, version anglaise. Chacune répond à une limite concrète du matching à deux, pas à un effet de vitrine.

### Cercles d'échange

**Le problème.** Le matching à deux exige une double coïncidence : Aminata (Dakar) veut FastAPI et enseigne React ; Kwame (Accra) enseigne FastAPI mais veut Docker ; Imani (Nairobi) enseigne Docker et veut React. Aucune paire ne se complète, et pourtant les trois ont tout pour s'entraider. C'est le même problème que les dons croisés de reins, résolu de la même façon : chercher des **cycles** dans le graphe « qui peut apprendre quoi à qui ».

**Choix.** `circles/finder.py` est un module pur (aucun accès base) : il construit le graphe, énumère les cycles de 3 et 4 personnes qui passent par moi, et les note (niveau de chaque flèche, pénalité légère pour 4 personnes, plus difficile à coordonner). Un cercle dont deux membres se complètent déjà directement est écarté : l'échange à deux reste plus simple. Au-delà de 4, la coordination devient irréaliste et la recherche explose : la limite est volontaire. Le cercle est **recalculé** au moment où on le propose, pour qu'une suggestion périmée (compétence retirée entre-temps) ne s'enregistre pas.

**Même règle de confidentialité qu'un échange.** Les contacts ne se révèlent qu'une fois que **tous** ont accepté ; un seul refus clôt le cercle. Les réponses simultanées sont protégées par un verrou de ligne (`select_for_update`), sinon deux « oui » concurrents pourraient laisser un cercle « proposé » alors que tout le monde a accepté.

### Observatoire des compétences

**Pourquoi.** Les données de la plateforme disent quelque chose d'utile au-delà de chaque profil : où manque-t-il des compétences, et quels échanges traversent une frontière (« FastAPI est recherché au Sénégal, proposé au Ghana »). C'est la page qui parle à un jury, à une école ou à un bailleur.

**Uniquement des comptes.** `/observatory/` est public et ne renvoie aucun nom ni identifiant : il additionne des informations déjà publiques sur chaque profil. Trois requêtes en tout, quel que soit le nombre de développeurs. Le graphique (offre et demande par compétence) suit les règles de visualisation habituelles : une seule échelle, deux couleurs vérifiées pour le daltonisme sur fond sombre, une étiquette sur chaque barre et un tableau équivalent pour les lecteurs d'écran.

### Compétences validées par les pairs

**Le problème.** Déclarer « Node.js, avancé » ne coûte rien. Les preuves (dépôts, certifications) aident, mais elles ne disent pas si la personne sait **transmettre**.

**Choix.** On ne peut valider que ce qu'on a vu : après un échange **terminé** avec la personne (n'importe laquelle de ses compétences proposées), ou dans un cercle **actif** (seulement la compétence qu'elle nous enseigne). La règle est dans un seul module (`skills/endorsements.py`) et vérifiée côté serveur ; l'interface ne fait que la refléter. Une validation est publique (nom, pays, commentaire), elle se retire à tout moment, et la politique de confidentialité le dit. Pas de note sur 5 ni de classement : une note invite à la complaisance ou à la revanche, une validation nominative engage celui qui la donne.

### Version anglaise

**Pourquoi.** « Développeurs africains » inclut le Ghana, le Nigeria, le Kenya, l'Afrique du Sud : une plateforme seulement francophone coupe le continent en deux, alors que les cercles et les ponts de l'observatoire relient justement Dakar à Accra et Nairobi.

**Choix technique : le français sert de clé.** Plutôt qu'une bibliothèque (i18next et consorts) et des clés abstraites (`dashboard.title`), chaque texte reste écrit en français dans le composant et passe par `t('…')` ; `src/i18n/en.ts` donne l'anglais. Le code reste lisible tel quel, une traduction manquante retombe sur le français (jamais d'écran vide), et un test lit le code source pour vérifier que **chaque** texte passé à `t()` a sa traduction : un oubli fait échouer la CI. Les pluriels passent par `tn()` (le français met 0 au singulier, l'anglais non). Les noms de pays viennent du navigateur (`Intl.DisplayNames`) à partir du code ISO : aucun dictionnaire de 54 pays à maintenir.

**Côté serveur.** Le frontend envoie `Accept-Language`. Django traduit ses propres messages (`LocaleMiddleware`) ; les messages propres à DevLink sont traduits au même endroit (`core/i18n.py`), avec le même garde-fou : un test parcourt le code (module `ast`) et échoue si un message d'erreur levé n'a pas de traduction. Pas de fichiers gettext compilés : il aurait fallu installer les outils GNU gettext dans l'image Docker pour une soixantaine de phrases. Les fonctions d'IA rédigent dans la langue de l'interface.

**Ce qui reste en français.** Le contenu saisi par les utilisateurs (bios, descriptions de projets), qu'on ne traduit pas à leur place, et la page interne du design system.
