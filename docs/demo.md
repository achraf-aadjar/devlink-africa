# Parcours de démonstration en 8 étapes (+ 1)

Script à suivre devant le jury. Durée visée : **4 minutes**. À répéter deux fois au minimum avant le passage (DL-52, DL-57, DL-61).

Ce parcours est protégé par deux tests automatiques, lancés à chaque modification : `backend/tests/test_parcours_demo.py` (par l'API) et `e2e/tests/parcours-demo.spec.ts` (dans Chromium, en cliquant dans l'interface). Si l'un échoue, la démonstration est cassée. Pour le rejouer avant le passage : `make e2e`.

---

## Avant de commencer

| À vérifier | Comment |
|---|---|
| Le site répond | Ouvrir `https://<domaine>/api/v1/health/` |
| Les données de démonstration sont chargées | La page Recherche affiche 22 développeurs |
| Deux onglets sont prêts | L'un sur l'accueil, l'autre sur le Project Hub |
| Un compte de secours existe | Au cas où l'inscription en direct échouerait |

**Comptes de démonstration** : `aminata@demo.devlink.africa` et les 21 autres, mot de passe `demo-devlink-2026-xyz`. Tous portent la mention « Profil de démonstration ».

**Langue** : l'interface s'ouvre dans la langue du navigateur. Vérifier qu'elle est en français avant de commencer (bouton `FR`/`EN` en haut à droite) : l'étape 9 la bascule en anglais, et le choix est mémorisé.

---

## Étape 1 · Le problème (30 s)

**Écran** : page d'accueil.

> « Un développeur à Dakar maîtrise React mais bloque sur Docker. À 300 kilomètres, un autre maîtrise Docker et veut apprendre React. Ils ne se rencontreront jamais. Les réseaux professionnels proposent des gens qui vous ressemblent ; nous proposons des gens qui vous **complètent**. »

---

## Étape 2 · Création du profil (30 s)

**Écran** : Inscription, puis Mon profil.

1. Créer un compte avec une adresse de démonstration.
2. Montrer la **case de consentement** et le lien vers la politique de confidentialité.
3. Renseigner le pays, une courte présentation, les disponibilités, et un **moyen de contact** (lien GitHub, par exemple).

> « Le consentement est explicite, comme l'exige la loi sénégalaise n° 2008-12. Nous ne demandons ni téléphone, ni adresse. L'adresse e-mail ne sera jamais visible par les autres. »

**À montrer** : le pourcentage de complétude du profil, qui progresse.

---

## Étape 3 · Les compétences (40 s)

**Écran** : Mes compétences.

1. Dans « Je sais faire » : ajouter **React**, niveau avancé.
2. Dans « Je veux apprendre » : ajouter **Docker**.

> « Deux listes distinctes : ce que je sais, ce que je cherche. C'est tout ce dont l'algorithme a besoin. »

**À montrer** : le message qui confirme que les matchs ont été recalculés.

---

## Étape 4 · Dev Match propose quelqu'un (30 s)

**Écran** : Mes matchs.

> « Immédiatement, Dev Match propose des développeurs complémentaires, triés par score. »

**À montrer** : le score du premier match, et les deux premières raisons affichées sur la carte.

---

## Étape 5 · L'explication du match (60 s)

**Écran** : détail d'un match. **C'est le moment le plus important de la démonstration.**

> « Nous n'affichons jamais un score sans l'expliquer. »

Montrer les trois niveaux de lecture, dans cet ordre :

1. **Le score**, en grand.
2. **« Il peut vous apprendre Docker » / « Vous pouvez lui apprendre React »** : la complémentarité, en clair.
3. **La répartition par critère** : six barres, avec les points obtenus sur le maximum.

> « La somme de ces points est exactement égale au score affiché. L'utilisateur peut refaire le calcul lui-même. Un test automatique vérifie cette égalité sur toutes les combinaisons possibles. »

**Phrase à ne pas oublier** :

> « Et si l'échange ne va que dans un sens, le score est plafonné à 55, alors qu'un vrai échange dépasse 90. Nous proposons des échanges, pas du service gratuit. »

---

## Étape 6 · La demande d'échange (40 s)

**Écran** : détail du match, bouton « Proposer un échange ».

1. Choisir **Mentorat** parmi les huit types.
2. Écrire un court message.
3. Envoyer.

> « Huit types d'échange : mentorat, revue de code, pair programming, projet commun, préparation d'entretien… »

**À montrer** : dans l'autre onglet, se connecter avec le compte destinataire (`mamadou@demo.devlink.africa` si le compte créé sait React et veut apprendre Docker). La pastille à côté de « Échanges » signale la demande. **Accepter** la demande : le panneau « Échange accepté » affiche aussitôt le moyen de contact de l'autre, des deux côtés. La boucle est fermée.

> « Tant que la demande n'est pas acceptée, personne ne voit le contact de l'autre. C'est l'acceptation qui vaut accord pour être joint. »

---

## Étape 7 · Project Hub (40 s)

**Écran** : Projets.

> « Au-delà des échanges entre deux personnes, des projets africains cherchent des contributeurs. »

1. Ouvrir **Agri-Collecte** (collecte de données agricoles hors ligne).
2. Montrer les compétences recherchées.
3. Cliquer sur « Rejoindre le projet » et envoyer une demande.

> « Le porteur du projet voit la demande dans son tableau de bord et décide. »

---

## Étape 8 · La vision (30 s)

**Écran** : Explorer par pays, puis le tableau de bord.

> « Aujourd'hui 17 pays représentés dans notre démonstration. Chaque pays devient une porte d'entrée vers ses développeurs et ses projets. »

> « DevLink Africa ne crée pas de compétences : il révèle celles qui existent déjà sur le continent, et les met en circulation. Un développeur à Niamey peut apprendre de quelqu'un à Kigali, aujourd'hui, gratuitement. »

---

## Étape 9 · Ce qui nous distingue (2 min, si le temps le permet)

Ces écrans sont rejoués dans Chromium par `e2e/tests/parcours-demo.spec.ts` (le cercle, la validation et la bascule en anglais).

**Le cercle d'échange.** Se connecter en `aminata@demo.devlink.africa`, ouvrir **Cercles**.

> « Aminata, à Dakar, veut FastAPI et enseigne React. Kwame, à Accra, enseigne FastAPI mais veut Docker. Imani, à Nairobi, enseigne Docker et veut React. Aucune paire ne marche. Le trio, si : chacun apprend au suivant. »

Montrer le schéma (score 100), puis « Proposer ce cercle ». Les contacts ne se débloquent que quand les trois ont accepté.

**L'observatoire.** Ouvrir **Observatoire** (pied de page, ou lien de la page Pays).

> « Ce que le continent sait, et ce qu'il cherche. Que des chiffres, aucun nom. En bas, les ponts : une compétence recherchée dans un pays et déjà proposée dans un autre. »

**Les validations.** Ouvrir le profil public d'**Ibrahim** (Recherche → Ibrahim).

> « Fatou a terminé un échange avec Ibrahim : elle a validé son Node.js et son CI/CD, avec un commentaire. On ne peut valider que ce qu'on a vu à l'œuvre. »

**L'anglais.** Cliquer sur `EN` en haut à droite.

> « Toute l'interface passe en anglais, y compris les messages d'erreur et les raisons d'un match, écrites par le serveur. Le Ghana, le Nigeria, le Kenya font partie de l'Afrique. »

Revenir en français (`FR`) avant la suite.

---

## Si quelque chose tombe en panne

| Problème | Réponse |
|---|---|
| L'inscription échoue | Se connecter avec un compte de démonstration existant, préparé à l'avance |
| Aucun match n'apparaît | Vérifier que les deux compétences sont bien enregistrées ; le recalcul est immédiat |
| Le site ne répond pas | Montrer `/api/v1/health/?detail=1` et expliquer la sonde ; basculer sur la copie locale |
| Une question technique bloque | Renvoyer à `docs/EXPLICATION_JURY.md`, qui prépare les réponses |

**Règle** : ne jamais improviser une explication technique incertaine. Dire « je vérifie et je vous réponds » vaut mieux qu'une approximation.
