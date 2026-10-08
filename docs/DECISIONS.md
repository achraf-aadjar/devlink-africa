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

## 2026-10-08 — Connexion avec Google

**Décision.** Ajout de « Continuer avec Google » à l'inscription et à la connexion, sur demande d'Achraf. Même principe que les fonctions d'IA : **désactivé par défaut**, invisible côté interface tant qu'aucun identifiant n'est configuré, et le produit fonctionne entièrement sans — ce n'est pas la seule porte d'entrée.

**Ce que je ne peux pas faire moi-même.** Activer réellement ce bouton demande un identifiant client OAuth, obtenu sur [Google Cloud Console](https://console.cloud.google.com/) : créer un projet, configurer l'écran de consentement, créer un identifiant « OAuth 2.0 » de type « Application Web », et y déclarer les origines autorisées (`http://localhost:5173` en développement, le domaine réel une fois déployé). Ça suppose un compte Google et d'accepter leurs conditions au nom du projet — une démarche humaine, pas quelque chose que je dois faire à la place d'Achraf. Une fois l'identifiant obtenu, il suffit de le coller dans `backend/.env` (`GOOGLE_CLIENT_ID=...`) : le bouton apparaît alors de lui-même, aucun redéploiement de code nécessaire.

**Vérification du jeton, sans `requests`.** La bibliothèque `google-auth` (Apache-2.0, licences de ses dépendances toutes vérifiées : MIT, BSD) sait vérifier un jeton d'identité Google, mais la plupart des exemples s'appuient sur `google.auth.transport.requests`, qui tire `requests` puis `certifi` (MPL-2.0, interdite par le règlement). `accounts/google_auth.py` fournit donc son propre petit adaptateur HTTP basé sur `urllib`, exactement sur le modèle de `ai/client.py` pour les appels au service d'IA : même contrainte, même solution, déjà éprouvée dans ce projet.

**Pourquoi un compte Google peut se connecter à un compte déjà créé par mot de passe.** Google garantit qu'une adresse est vérifiée (`email_verified`) avant de nous la transmettre : si quelqu'un a déjà un compte par mot de passe sur cette adresse, on peut donc s'y connecter en toute confiance via Google plutôt que de créer un doublon. Le mot de passe existant n'est jamais touché. Un compte créé pour la première fois par Google, lui, n'a pas de mot de passe utilisable (`set_unusable_password`, mécanisme standard de Django) tant que la personne n'en choisit pas un depuis son profil.

**Le consentement RGPD-like (loi n° 2008-12).** L'inscription par mot de passe impose une case à cocher explicite. Reproduire exactement ce mécanisme pour un bouton Google est impossible proprement : cliquer sur le bouton déclenche directement la fenêtre de connexion de Google, on ne peut pas intercepter ce clic pour vérifier une case au préalable. Solution retenue, standard sur la quasi-totalité des sites qui proposent une connexion sociale (GitHub et Google y compris) : un texte, « En continuant, vous acceptez notre politique de confidentialité », avec un lien, affiché juste au-dessus du bouton. Le clic qui suit est l'acte explicite ; c'était déjà, de fait, comment la case à cocher elle-même fonctionnait.
