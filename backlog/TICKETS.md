# Backlog DevLink Africa

Équipe : Achraf (backend, base de données, déploiement, sécurité), Emmanuel (frontend, UX, qualité), Omar (matching, recherche, IA, données, conformité).

Priorités : P0 indispensable, P1 important, P2 si le temps le permet (à sacrifier en premier).

## Charge estimée (heures)

| | S1 | S2 | S3 | S4 | S5 | S6 | Total |
|---|---|---|---|---|---|---|---|
| Achraf | 20.5 | 27 | 21 | 2 | 18 | 0.5 | **89** |
| Emmanuel | 20 | 25 | 19 | 5 | 19 | 0.5 | **88.5** |
| Omar | 15 | 23 | 20 | 20 | 13 | 0.5 | **91.5** |

## Sprints

- **Sprint 1 · Fondations** : 2026-10-06 → 2026-10-08
- **Sprint 2 · Cœur fonctionnel** : 2026-10-09 → 2026-10-15
- **Sprint 3 · Compléments** : 2026-10-16 → 2026-10-19
- **Sprint 4 · IA (si le jalon du 15 oct est tenu)** : 2026-10-20 → 2026-10-21
- **Sprint 5 · Finalisation et soumission** : 2026-10-22 → 2026-10-24
- **Sprint 6 · Vote des pairs** : 2026-10-25 → 2026-10-26

# Achraf

## Sprint 1 · Fondations (2026-10-06 → 2026-10-08)

- [ ] **DL-01** Protéger la branche main sur GitHub · P0 · 0.5 h · échéance 2026-10-08
  - Dans les réglages GitHub : protéger la branche main (1 revue obligatoire, pas de push direct). Le README, AI_USAGE.md et le modèle de pull request sont déjà faits par la préparation de l'environnement.
  - ✔ Push direct sur main refusé, 1 revue obligatoire
  - ✔ Les 3 membres ont un accès en écriture au dépôt
- [ ] **DL-02** Modèles Django, migrations et base de données · P0 · 5 h · échéance 2026-10-08
  - Créer le projet Django dans backend/ et les modèles du modèle de données de la présentation : utilisateur (email comme identifiant), profil, compétence, compétence d'utilisateur (proposée ou recherchée, niveau), projet, échange, match. Base SQLite en mode WAL pour démarrer, car le pilote psycopg de PostgreSQL est sous licence LGPL (voir le ticket licences). Aucun champ propre à PostgreSQL, pour pouvoir changer de base plus tard si l'organisateur l'autorise.
  - ✔ python manage.py migrate crée toutes les tables
  - ✔ Les modèles reprennent le modèle de données de la présentation
  - ✔ Aucune dépendance à psycopg
  - ✔ Réglages lus dans des variables d'environnement, aucun secret dans le dépôt
  - ✔ Catalogue de compétences chargé par une migration de données
- [ ] **DL-03** Authentification : inscription, connexion, déconnexion · P0 · 6 h · échéance 2026-10-08 · dépend de DL-02
  - Routes /auth/register, /auth/login, /auth/logout avec Django REST framework et djangorestframework-simplejwt. Mots de passe hachés avec Argon2 (argon2-cffi), jeton d'accès à durée limitée.
  - ✔ Email unique (409 si doublon), mot de passe d'au moins 10 caractères
  - ✔ Limitation de débit sur /auth/* (throttling DRF, 5 essais par minute et par IP)
  - ✔ Aucun mot de passe ni jeton dans les logs
  - ✔ Tests automatiques (pytest-django) des cas passants et en erreur
- [ ] **DL-04** Figer le contrat d'API v1 · P0 · 3 h · échéance 2026-10-07
  - Relire docs/api.md avec Emmanuel et Omar, compléter les champs manquants (types d'échange, preuves, signalement, dashboard) et geler le contrat. Générer le schéma OpenAPI avec drf-spectacular (BSD-3).
  - ✔ docs/api.md validé par les 3 membres
  - ✔ La page de documentation générée est cohérente avec docs/api.md
  - ✔ Exemple JSON pour chaque route
  - ✔ Après gel : toute modification passe par une PR et l'accord des 3
- [ ] **DL-05** Premier déploiement sur Datacloud (VPS Dakar + HTTPS) · P0 · 6 h · échéance 2026-10-08 · dépend de DL-02
  - Commander le VPS à Dakar avec le code promo 40 % (les VPS hors Dakar sont exclus de la remise). Gunicorn derrière nginx, build React servi par nginx, HTTPS, URL publique, déploiement depuis main, secrets hors du dépôt.
  - ✔ https://<url>/health répond depuis Internet
  - ✔ Déploiement reproductible par un script ou une action GitHub
  - ✔ Justificatif d'achat Datacloud conservé (condition de recevabilité, art. 6)

## Sprint 2 · Cœur fonctionnel (2026-10-09 → 2026-10-15)

- [ ] **DL-14** API profil : GET/PATCH /me, GET /users/{id} · P0 · 4 h · échéance 2026-10-15 · dépend de DL-03
  - Lecture et modification du profil, profil public.
  - ✔ Pays valide, disponibilités parmi MENTORING/COLLABORATION/OPEN_SOURCE/FREELANCE
  - ✔ Bio limitée en taille
  - ✔ Un utilisateur ne modifie que son profil
  - ✔ Le profil public n'expose jamais l'email
- [ ] **DL-15** API compétences : /skills, /me/skills · P0 · 4 h · échéance 2026-10-15 · dépend de DL-03
  - Catalogue par catégorie, ajout et suppression de compétences proposées (OFFERED) ou recherchées (WANTED) avec niveau.
  - ✔ Unicité (utilisateur, compétence, type)
  - ✔ Niveau BEGINNER/INTERMEDIATE/ADVANCED
  - ✔ Déclenche le recalcul des matchs (ticket Omar)
- [ ] **DL-16** API projets : CRUD et filtres · P0 · 5 h · échéance 2026-10-15 · dépend de DL-03
  - GET/POST /projects, GET/PATCH/DELETE /projects/{id}. Besoins, statut, dépôt Git, démo.
  - ✔ Seul le propriétaire modifie ou supprime
  - ✔ Filtres pays, technologie, statut
  - ✔ URLs validées (https uniquement)
- [ ] **DL-17** Demandes pour rejoindre un projet · P1 · 5 h · échéance 2026-10-15 · dépend de DL-16
  - Modèle ProjectJoinRequest. POST /projects/{id}/join, PATCH pour accepter ou refuser (propriétaire).
  - ✔ Une seule demande en attente par personne et par projet
  - ✔ Le propriétaire voit les demandes de son projet uniquement
  - ✔ Notification visible dans le dashboard
- [ ] **DL-18** API échanges et types d'échange · P0 · 5 h · échéance 2026-10-15 · dépend de DL-03
  - Modèle Exchange avec champ type (PAIR_PROGRAMMING, CODE_REVIEW, MENTORAT, DEBUGGING, PROJET_COMMUN, PREPARATION_ENTRETIEN, ECHANGE_COMPETENCES, DISCUSSION). Routes : POST /matches/{id}/request, GET /exchanges, PATCH /exchanges/{id}.
  - ✔ Une seule demande en attente par paire d'utilisateurs
  - ✔ Seul le destinataire accepte ou refuse
  - ✔ On ne peut pas s'envoyer une demande à soi-même
- [ ] **DL-19** Permissions et validation transversales · P0 · 4 h · échéance 2026-10-15 · dépend de DL-14
  - Permissions DRF (utilisateur connecté, propriétaire uniquement), sérialiseurs stricts, ORM Django uniquement.
  - ✔ Tests de permissions sur chaque ressource (accès à la ressource d'un autre = 403/404)
  - ✔ Aucun SQL brut concaténé dans le code

## Sprint 3 · Compléments (2026-10-16 → 2026-10-19)

- [ ] **DL-28** API dashboard agrégée · P0 · 3 h · échéance 2026-10-19 · dépend de DL-24, DL-18
  - GET /dashboard : matchs recommandés, demandes en attente, mes projets, complétude du profil.
  - ✔ Une seule requête côté client
  - ✔ Temps de réponse < 300 ms
- [ ] **DL-29** Durcissement sécurité · P0 · 5 h · échéance 2026-10-19 · dépend de DL-19
  - Limitation de débit globale, CORS strict (django-cors-headers), en-têtes de sécurité Django, limite de taille des requêtes, journal d'audit, revue OWASP rapide.
  - ✔ Aucun secret dans le dépôt (vérification par scan)
  - ✔ python manage.py check --deploy sans avertissement
  - ✔ Tests d'injection et XSS de base
  - ✔ Rapport court dans docs/sécurité.md
- [ ] **DL-30** Surveillance et sauvegardes · P0 · 4 h · échéance 2026-10-19 · dépend de DL-05
  - /health détaillé, logs structurés, test de disponibilité externe, sauvegarde quotidienne de la base (commande .backup de SQLite) avec test de restauration.
  - ✔ Alerte si le site tombe
  - ✔ Restauration testée au moins une fois
- [ ] **DL-31** Compétences avec preuves : API · P1 · 5 h · échéance 2026-10-19 · dépend de DL-15
  - Modèle SkillProof (projet, dépôt GitHub, contribution open source, certification, challenge) et routes CRUD.
  - ✔ URL validée
  - ✔ Une preuve appartient à l'utilisateur qui l'ajoute
  - ✔ Plusieurs preuves possibles par compétence
- [ ] **DL-32** Signalement : API · P1 · 4 h · échéance 2026-10-19 · dépend de DL-19
  - Modèle Report, POST /reports pour un profil ou un projet, avec motif.
  - ✔ Un signalement par personne et par cible
  - ✔ Limite de débit pour éviter l'abus

## Sprint 4 · IA (si le jalon du 15 oct est tenu) (2026-10-20 → 2026-10-21)

- [ ] **DL-41** Limites et budget des appels IA · P1 · 2 h · échéance 2026-10-21 · dépend de DL-43
  - Rate limiting spécifique et plafond quotidien des appels.
  - ✔ Dépassement = repli sans IA, pas d'erreur

## Sprint 5 · Finalisation et soumission (2026-10-22 → 2026-10-24)

- [ ] **DL-48** Version de production figée · P0 · 4 h · échéance 2026-10-22 · dépend de DL-30
  - Sauvegarde de la base, variables de production, vérification HTTPS et URL stable, retour arrière.
  - ✔ URL stable
  - ✔ VPS payé jusqu'au 2 novembre au minimum (vérifier la durée)
  - ✔ Procédure de retour arrière écrite
- [ ] **DL-49** Corrections et stabilisation (backend) · P0 · 6 h · échéance 2026-10-24
  - Corriger les bugs remontés par Emmanuel. Aucune nouvelle fonctionnalité.
  - ✔ Zéro bug bloquant sur le parcours de démo
- [ ] **DL-50** Compiler AI_USAGE.md et LICENSES.md finaux · P0 · 2 h · échéance 2026-10-23
  - Rassembler les entrées des 3 membres, vérifier la cohérence.
  - ✔ Chaque usage d'IA liste (outil, partie du projet, membre)
  - ✔ Code préalable d'un membre declare s'il existe
- [ ] **DL-51** Soumettre le projet sur Datacloud (au plus tard le 24 oct) · P0 · 2 h · échéance 2026-10-24 · dépend de DL-48, DL-50, DL-59
  - Soumission par le représentant de l'équipe, avec composants, licences et déclaration IA.
  - ✔ Soumission faite le 24 oct, pas le 25
  - ✔ Capture de confirmation conservée
- [ ] **DL-52** Préparer ma partie du pitch et répondre aux questions · P0 · 3 h · échéance 2026-10-23
  - Répéter le parcours de démo en 8 étapes (2 fois au minimum). Savoir expliquer sa partie sans aide, y compris le code généré par IA.
  - ✔ Explication de 2 minutes de ma partie
  - ✔ Réponses aux questions techniques probables
- [ ] **DL-53** Déclaration de titularité · P0 · 1 h · échéance 2026-10-23
  - Confirmer que le projet n'appartient a aucun employeur, client ou établissement d'enseignement. Si tu es étudiant, vérifier le règlement de l'école sur la propriété intellectuelle et obtenir une autorisation écrite si nécessaire.
  - ✔ Déclaration exacte (toute fausse déclaration = disqualification)
  - ✔ Autorisation écrite jointe si nécessaire

## Sprint 6 · Vote des pairs (2026-10-25 → 2026-10-26)

- [ ] **DL-63** Voter dans le délai (25 oct 18 h - 26 oct 23 h 59 GMT) · P0 · 0.5 h · échéance 2026-10-26
  - Le vote est obligatoire pour chaque membre : un seul oubli exclut toute l'équipe. Voter des l'ouverture, ne pas attendre.
  - ✔ Vote effectué le 25 oct, avant 23 h 59 le 26 oct
  - ✔ Capture de confirmation envoyée au groupe


# Emmanuel

## Sprint 1 · Fondations (2026-10-06 → 2026-10-08)

- [ ] **DL-06** Initialiser React (Vite, TypeScript), Tailwind et client API · P0 · 4 h · échéance 2026-10-08
  - Créer l'application dans frontend/ avec Vite, React, TypeScript et React Router. Client d'API typé avec gestion du jeton. Versions imposées par la règle des licences : vite@6, @vitejs/plugin-react@4, tailwindcss@3. Vite 8 et Tailwind 4 embarquent lightningcss, sous licence MPL-2.0 (à réciprocité).
  - ✔ L'application démarre et s'affiche
  - ✔ Variable VITE_API_URL configurable
  - ✔ Versions de vite, plugin-react et tailwindcss figées dans package.json
  - ✔ scripts/check_licenses.sh sans licence GPL, AGPL, LGPL ni MPL
- [ ] **DL-07** Design system et navigation · P0 · 5 h · échéance 2026-10-08 · dépend de DL-06
  - Couleurs, typographie, boutons, champs, cartes, badges de compétence, barre de navigation, états chargement/erreur/vide.
  - ✔ Composants réutilisables documentes dans une page de démo
  - ✔ Navigation responsive
  - ✔ Contrastes lisibles
- [ ] **DL-08** Pages inscription et connexion · P0 · 5 h · échéance 2026-10-08 · dépend de DL-03, DL-06
  - Formulaires reliés à l'API, gestion du jeton, routes protégées, messages d'erreur clairs.
  - ✔ Inscription puis connexion de bout en bout
  - ✔ Pages privées inaccessibles sans connexion
  - ✔ Validation côté client alignée sur l'API
- [ ] **DL-09** Maquettes des 4 écrans de démo · P0 · 6 h · échéance 2026-10-08
  - Profil, liste des matchs, détail d'un match (explication), Project Hub. Mobile et ordinateur.
  - ✔ Maquettes validées par l'équipe le 8 oct
  - ✔ Parcours de démo en 8 étapes décrit en une page (docs/démo.md)

## Sprint 2 · Cœur fonctionnel (2026-10-09 → 2026-10-15)

- [ ] **DL-20** Page profil (Dev Passport) · P0 · 6 h · échéance 2026-10-15 · dépend de DL-14, DL-07
  - Voir et modifier son profil, profil public d'un autre développeur.
  - ✔ Édition pays, bio, disponibilités, domaines, avatar
  - ✔ Profil public avec compétences et projets
  - ✔ Étiquette 'démo' sur les profils de démonstration
- [ ] **DL-21** Page compétences : Je sais / Je veux apprendre · P0 · 6 h · échéance 2026-10-15 · dépend de DL-15, DL-07
  - Ajout de compétences par catégorie avec niveau, deux listes distinctes.
  - ✔ Ajout et suppression sans rechargement
  - ✔ Badges par niveau
  - ✔ Mise à jour visible des matchs après modification
- [ ] **DL-22** Project Hub : liste, fiche, création, 'Rejoindre' · P0 · 8 h · échéance 2026-10-15 · dépend de DL-16, DL-07
  - Liste filtrable, fiche projet, formulaire de création et d'édition, bouton Rejoindre.
  - ✔ Filtres pays, technologie, statut
  - ✔ Fiche avec besoins, dépôt, démo
  - ✔ Le propriétaire gère ses demandes
- [ ] **DL-23** Échanges : proposition, liste, réponse · P0 · 5 h · échéance 2026-10-15 · dépend de DL-18, DL-07
  - Fenêtre de proposition (type et message), onglets reçues/envoyées, accepter/refuser.
  - ✔ Message obligatoire et limite en taille
  - ✔ Statut visible pour les deux personnes

## Sprint 3 · Compléments (2026-10-16 → 2026-10-19)

- [ ] **DL-33** Dashboard · P0 · 6 h · échéance 2026-10-19 · dépend de DL-28, DL-26
  - Matchs recommandés, demandes en attente, mes projets, complétude du profil.
  - ✔ Charge en moins de 2 s
  - ✔ Chaque carte renvoie vers l'action utile
- [ ] **DL-34** Responsive, accessibilité et états vides · P0 · 6 h · échéance 2026-10-19 · dépend de DL-22, DL-20, DL-21, DL-23
  - Passage mobile sur tous les écrans, navigation clavier, contrastes, messages d'erreur et états vides.
  - ✔ Aucun défilement horizontal sur mobile
  - ✔ Tous les formulaires utilisables au clavier
- [ ] **DL-35** Compétences avec preuves : interface · P1 · 4 h · échéance 2026-10-19 · dépend de DL-31
  - Ajout de preuves a une compétence, affichage d'un badge 'preuve' sur le profil public.
  - ✔ Lien externe ouvert dans un nouvel onglet avec rel=noopener
- [ ] **DL-36** Bouton Signaler · P1 · 3 h · échéance 2026-10-19 · dépend de DL-32
  - Fenêtre de signalement sur les profils et les projets.
  - ✔ Confirmation visible après l'envoi

## Sprint 4 · IA (si le jalon du 15 oct est tenu) (2026-10-20 → 2026-10-21)

- [ ] **DL-42** Interface des fonctions IA · P1 · 5 h · échéance 2026-10-21 · dépend de DL-44, DL-45
  - Bouton 'Remplir depuis un texte', champ de recherche naturelle, résumé, états de repli.
  - ✔ Chaque fonction a un état 'IA indisponible'

## Sprint 5 · Finalisation et soumission (2026-10-22 → 2026-10-24)

- [ ] **DL-54** Test de bout en bout du parcours de démo · P0 · 6 h · échéance 2026-10-22 · dépend de DL-48
  - Les 8 étapes sur l'URL publique, sur mobile et deux navigateurs.
  - ✔ Liste des bugs remise aux autres membres le 22 oct
  - ✔ Parcours rejoué sans erreur après corrections
- [ ] **DL-55** Corrections et stabilisation (frontend) · P0 · 6 h · échéance 2026-10-24
  - Corriger les bugs de l'interface. Aucune nouvelle fonctionnalité.
  - ✔ Zéro bug bloquant sur le parcours de démo
- [ ] **DL-56** README final et captures · P0 · 3 h · échéance 2026-10-24
  - Architecture, installation, captures d'écran, parcours de démo.
  - ✔ Un tiers peut lancer le projet avec le README seul
- [ ] **DL-57** Préparer ma partie du pitch et répondre aux questions · P0 · 3 h · échéance 2026-10-23
  - Répéter le parcours de démo en 8 étapes (2 fois au minimum). Savoir expliquer sa partie sans aide, y compris le code généré par IA.
  - ✔ Explication de 2 minutes de ma partie
  - ✔ Réponses aux questions techniques probables
- [ ] **DL-58** Déclaration de titularité · P0 · 1 h · échéance 2026-10-23
  - Confirmer que le projet n'appartient a aucun employeur, client ou établissement d'enseignement. Si tu es étudiant, vérifier le règlement de l'école sur la propriété intellectuelle et obtenir une autorisation écrite si nécessaire.
  - ✔ Déclaration exacte (toute fausse déclaration = disqualification)
  - ✔ Autorisation écrite jointe si nécessaire

## Sprint 6 · Vote des pairs (2026-10-25 → 2026-10-26)

- [ ] **DL-64** Voter dans le délai (25 oct 18 h - 26 oct 23 h 59 GMT) · P0 · 0.5 h · échéance 2026-10-26
  - Le vote est obligatoire pour chaque membre : un seul oubli exclut toute l'équipe. Voter des l'ouverture, ne pas attendre.
  - ✔ Vote effectué le 25 oct, avant 23 h 59 le 26 oct
  - ✔ Capture de confirmation envoyée au groupe


# Omar

## Sprint 1 · Fondations (2026-10-06 → 2026-10-08)

- [ ] **DL-10** Écrire à l'organisateur (cadev@systalink.com) · P0 · 1 h · échéance 2026-10-06
  - Poser les questions : date de publication du jury (art. 3 et art. 7), dates du vote du public, liste des Pays éligibles, Linux et SQLite comme services d'exécution. Et surtout : le pilote psycopg de Django pour PostgreSQL (LGPL) est-il accepté ? Une dépendance sous MPL-2.0 est-elle acceptée ?
  - ✔ Courriel envoyé le 6 oct
  - ✔ Réponses archivées dans docs/organisateur.md
- [ ] **DL-11** Service de matching branché sur la base + cas limites · P0 · 5 h · échéance 2026-10-08 · dépend de DL-02
  - Fonction qui charge deux profils depuis la base (ORM Django) et appelle le module de scoring (matching/scoring.py, repris du squelette). Compléter les tests.
  - ✔ Tests : profil vide, une seule compétence, doublons, majuscules, match à sens unique, profils identiques
  - ✔ Score symétrique (A,B) = (B,A)
  - ✔ Aucun score > 100 ni < 0
- [ ] **DL-12** 20 profils et 8 projets de démo réalistes · P0 · 6 h · échéance 2026-10-08 · dépend de DL-02
  - Données fictives, clairement étiquetées, réparties sur plusieurs pays francophones d'Afrique.
  - ✔ 8 pays au minimum
  - ✔ is_demo = true et mention 'Profil de démonstration' visible dans l'interface
  - ✔ Commande manage.py seed_demo rejouable sans doublons
  - ✔ 3 paires avec un match > 75 % et 3 paires avec un match partiel
  - ✔ Aucune vraie personne ni vrai nom d'entreprise
- [ ] **DL-13** CI : tests et audit des licences à chaque PR · P0 · 3 h · échéance 2026-10-08
  - GitHub Actions : pytest et scripts/check_licenses.sh sur chaque pull request.
  - ✔ La CI échoue si une licence GPL/AGPL/LGPL apparait
  - ✔ La CI échoue si un test échoue
  - ✔ Badge de statut dans le README

## Sprint 2 · Cœur fonctionnel (2026-10-09 → 2026-10-15)

- [ ] **DL-24** API matching : /matches et /matches/{id} · P0 · 6 h · échéance 2026-10-15 · dépend de DL-11, DL-15
  - Liste triée par score, détail avec raisons, ce que chacun peut apprendre à l'autre. Recalcul à l'inscription et à chaque changement de compétences.
  - ✔ Réponse conforme à l'exemple de docs/api.md
  - ✔ Match a sens unique plafonné sans réciprocité
  - ✔ Recalcul incrémental (pas de recalcul de toute la base à chaque requête)
  - ✔ Pagination
- [ ] **DL-25** API recherche : /search/users et /search/projects · P0 · 6 h · échéance 2026-10-15 · dépend de DL-12
  - Recherche textuelle par l'ORM Django sur nom, bio, titre et description, plus filtres pays, technologie, niveau, disponibilité, domaine, compétences recherchées. Aucune fonction propre à PostgreSQL.
  - ✔ Combinaison de filtres
  - ✔ Résultats paginés
  - ✔ Moins de 300 ms sur les données de démo
- [ ] **DL-26** Pages matchs : liste et détail avec explication · P0 · 6 h · échéance 2026-10-15 · dépend de DL-24, DL-09
  - Cartes avec score et raisons, détail avec répartition des points par critère, bouton 'Proposer un échange'.
  - ✔ Explication lisible en moins de 5 secondes
  - ✔ État vide utile (aucun match : que faire ?)
  - ✔ Responsive
- [ ] **DL-27** Page de recherche développeurs et projets · P0 · 5 h · échéance 2026-10-15 · dépend de DL-25, DL-07
  - Barre de recherche, filtres, onglets utilisateurs/projets.
  - ✔ Filtres conservés dans l'URL
  - ✔ Résultats cliquables vers profil et fiche projet

## Sprint 3 · Compléments (2026-10-16 → 2026-10-19)

- [ ] **DL-37** Carte de l'Afrique interactive · P2 · 8 h · échéance 2026-10-19 · dépend de DL-38
  - Carte SVG ; un clic sur un pays ouvre l'exploration du pays.
  - ✔ Fonctionne sur mobile
  - ✔ Pays sans données grises mais cliquables
- [ ] **DL-38** Exploration par pays (API et page) · P1 · 6 h · échéance 2026-10-19 · dépend de DL-25
  - Page /pays/{code} : développeurs, projets, technologies les plus présentes.
  - ✔ Statistiques calculées en base
  - ✔ Pays sans données : message clair
- [ ] **DL-39** Retour sur les matchs (utile / pas utile) · P1 · 3 h · échéance 2026-10-19 · dépend de DL-26
  - Réponse au risque 'mauvais matching' : un retour par match, stocké pour analyse.
  - ✔ Un retour par utilisateur et par match
  - ✔ Aucun impact sur le score du MVP
- [ ] **DL-40** Page de confidentialité et mentions · P0 · 3 h · échéance 2026-10-19 · dépend de DL-08
  - Données collectées, finalités, durée, droits, contact (loi sénégalaise n° 2008-12). Lien en pied de page et à l'inscription.
  - ✔ Page accessible sans connexion
  - ✔ Case de consentement à l'inscription

## Sprint 4 · IA (si le jalon du 15 oct est tenu) (2026-10-20 → 2026-10-21)

- [ ] **DL-43** Couche IA avec interrupteur et repli · P1 · 4 h · échéance 2026-10-21
  - Client abstrait, variable AI_ENABLED, délais maximum, repli sans IA, journal des appels. Les clés restent côté serveur.
  - ✔ Le produit fonctionne entièrement avec AI_ENABLED=false
  - ✔ Aucune donnée personnelle inutile dans les requêtes
  - ✔ Licence du SDK vérifiée
  - ✔ Appel consigné dans AI_USAGE.md
- [ ] **DL-44** Extraction de compétences depuis un texte libre · P1 · 5 h · échéance 2026-10-21 · dépend de DL-43
  - À l'inscription, proposer des compétences déduites d'un texte, validées par l'utilisateur.
  - ✔ Rien n'est enregistré sans validation
  - ✔ Échec de l'IA = formulaire classique
- [ ] **DL-45** Recherche en langage naturel · P1 · 5 h · échéance 2026-10-21 · dépend de DL-43, DL-25
  - Convertir une phrase en critères (technologie, domaine, pays, niveau) puis appeler la recherche classique.
  - ✔ Critères affichés et modifiables
  - ✔ Repli vers la recherche classique
- [ ] **DL-46** Résumé de projet · P2 · 3 h · échéance 2026-10-21 · dépend de DL-43
  - Présentation courte générée à partir d'une description longue, modifiable.
  - ✔ Le propriétaire valide le résumé
- [ ] **DL-47** Explication du match rédigée · P2 · 3 h · échéance 2026-10-21 · dépend de DL-43, DL-24
  - Phrase d'explication en plus des raisons calculées.
  - ✔ Les raisons calculées restent la source de vérité

## Sprint 5 · Finalisation et soumission (2026-10-22 → 2026-10-24)

- [ ] **DL-59** Audit complet des licences · P0 · 4 h · échéance 2026-10-22 · dépend de DL-10
  - Dépendances directes et transitives, Python et Node. Conserver les rapports. Déclarer caniuse-lite (CC-BY-4.0, données de compatibilité des navigateurs utilisées à la compilation).
  - ✔ Aucune licence GPL, AGPL, LGPL ni MPL
  - ✔ licenses-python.csv et licenses-node.csv conservés
  - ✔ Réponse écrite de l'organisateur archivée sur psycopg et PostgreSQL si on les utilise
- [ ] **DL-60** Corrections et stabilisation (matching et recherche) · P0 · 5 h · échéance 2026-10-24
  - Corriger les bugs et vérifier la crédibilité des scores sur les données de démo.
  - ✔ Aucun score incohérent sur les profils de démo
- [ ] **DL-61** Préparer ma partie du pitch et répondre aux questions · P0 · 3 h · échéance 2026-10-23
  - Répéter le parcours de démo en 8 étapes (2 fois au minimum). Savoir expliquer sa partie sans aide, y compris le code généré par IA.
  - ✔ Explication de 2 minutes de ma partie
  - ✔ Réponses aux questions techniques probables
- [ ] **DL-62** Déclaration de titularité · P0 · 1 h · échéance 2026-10-23
  - Confirmer que le projet n'appartient a aucun employeur, client ou établissement d'enseignement. Si tu es étudiant, vérifier le règlement de l'école sur la propriété intellectuelle et obtenir une autorisation écrite si nécessaire.
  - ✔ Déclaration exacte (toute fausse déclaration = disqualification)
  - ✔ Autorisation écrite jointe si nécessaire

## Sprint 6 · Vote des pairs (2026-10-25 → 2026-10-26)

- [ ] **DL-65** Voter dans le délai (25 oct 18 h - 26 oct 23 h 59 GMT) · P0 · 0.5 h · échéance 2026-10-26
  - Le vote est obligatoire pour chaque membre : un seul oubli exclut toute l'équipe. Voter des l'ouverture, ne pas attendre.
  - ✔ Vote effectué le 25 oct, avant 23 h 59 le 26 oct
  - ✔ Capture de confirmation envoyée au groupe
