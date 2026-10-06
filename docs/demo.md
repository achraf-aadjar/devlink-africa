# Parcours de démonstration en 8 étapes

Script à suivre devant le jury. Durée visée : **4 minutes**. À répéter deux fois au minimum avant le passage (DL-52, DL-57, DL-61).

Ce parcours est protégé par un test automatique : `backend/tests/test_parcours_demo.py`. S'il échoue, la démonstration est cassée.

---

## Avant de commencer

| À vérifier | Comment |
|---|---|
| Le site répond | Ouvrir `https://<domaine>/api/v1/health/` |
| Les données de démonstration sont chargées | La page Recherche affiche 20 développeurs |
| Deux onglets sont prêts | L'un sur l'accueil, l'autre sur le Project Hub |
| Un compte de secours existe | Au cas où l'inscription en direct échouerait |

**Comptes de démonstration** : `aminata@demo.devlink.africa` et les 19 autres, mot de passe `demo-devlink-2026-xyz`. Tous portent la mention « Profil de démonstration ».

---

## Étape 1 · Le problème (30 s)

**Écran** : page d'accueil.

> « Un développeur à Dakar maîtrise React mais bloque sur Docker. À 300 kilomètres, un autre maîtrise Docker et veut apprendre React. Ils ne se rencontreront jamais. Les réseaux professionnels proposent des gens qui vous ressemblent ; nous proposons des gens qui vous **complètent**. »

---

## Étape 2 · Création du profil (30 s)

**Écran** : Inscription, puis Mon profil.

1. Créer un compte avec une adresse de démonstration.
2. Montrer la **case de consentement** et le lien vers la politique de confidentialité.
3. Renseigner le pays, une courte présentation, les disponibilités.

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

**À montrer** : dans l'autre onglet, se connecter avec le compte destinataire et **accepter** la demande. La boucle est fermée.

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

> « Aujourd'hui 15 pays représentés dans notre démonstration. Chaque pays devient une porte d'entrée vers ses développeurs et ses projets. »

> « DevLink Africa ne crée pas de compétences : il révèle celles qui existent déjà sur le continent, et les met en circulation. Un développeur à Niamey peut apprendre de quelqu'un à Kigali, aujourd'hui, gratuitement. »

---

## Si quelque chose tombe en panne

| Problème | Réponse |
|---|---|
| L'inscription échoue | Se connecter avec un compte de démonstration existant, préparé à l'avance |
| Aucun match n'apparaît | Vérifier que les deux compétences sont bien enregistrées ; le recalcul est immédiat |
| Le site ne répond pas | Montrer `/api/v1/health/?detail=1` et expliquer la sonde ; basculer sur la copie locale |
| Une question technique bloque | Renvoyer à `docs/EXPLICATION_JURY.md`, qui prépare les réponses |

**Règle** : ne jamais improviser une explication technique incertaine. Dire « je vérifie et je vous réponds » vaut mieux qu'une approximation.
