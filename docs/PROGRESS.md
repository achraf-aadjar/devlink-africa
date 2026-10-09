# Journal d'avancement

Une entrée par ticket : état, écarts avec le plan, questions ouvertes.

---

## Résultats des contrôles (clone propre, `make check` → exit 0)

| Contrôle | Résultat |
|---|---|
| `make setup` | exit 0 |
| Tests backend (SQLite) | 484 passés, 1 ignoré |
| Tests backend (PostgreSQL) | relancés par la CI à chaque PR (pas de PostgreSQL dans l'environnement du 2026-10-08) |
| Couverture backend | 98 % global, 98 % sur matching et services |
| Tests frontend | 185 passés |
| Couverture frontend | 92 % |
| Parcours de démonstration dans Chromium (`make e2e`) | passé, 12 s |
| Affichage mobile (390 px, 18 écrans) | aucun débordement |
| `ruff check` et `ruff format` | propre |
| ESLint `--max-warnings 0` et Prettier | propre |
| `tsc --noEmit` | propre |
| `manage.py check` | aucun problème |
| `manage.py check --deploy` | **aucun avertissement** |
| `makemigrations --check` | aucun changement en attente |
| Schéma OpenAPI | 0 avertissement, 0 erreur, 31 routes |
| `vite build` | réussi, 118 ko de JavaScript compressé |
| Licences | 38 paquets Python, 368 Node (frontend) + 3 Node (e2e), **0 problème** |
| Scan de secrets | 0 trouvé |
| Gunicorn | répond sur `/api/v1/health/` |

---

## Phase 1 · Fondations et accès — **terminée**

### DL-03 · Authentification — terminé

Routes `/api/v1/auth/{register,login,refresh,logout}/`. Architecture en couches : vue mince → sérialiseur → service.

Ajouts non prévus au ticket, mais exigés par le cahier des charges :
- gestionnaire d'exceptions unique, qui fige le format `detail`/`code`/`errors` ;
- refus des champs non déclarés (`StrictSerializer`) ;
- `BearerJWTAuthentication` : sans elle, DRF renvoyait 403 au lieu de 401 ;
- journal d'audit avec empreinte de l'adresse e-mail.

**Écart** : `token_blacklist` activé (fourni par simplejwt, aucune dépendance nouvelle), le cahier exigeant la liste noire à la déconnexion.

### DL-04 · Contrat d'API v1 — rédigé, **attend la validation à trois**

`docs/api.md` couvre 19 sections, toutes les routes des tickets, un exemple JSON chacune, le format d'erreur et les énumérations.

Alignements du code sur le contrat : `Skill.category`, `SkillProof.kind`, et **retrait du niveau `EXPERT`** (DL-15 n'en prévoit que trois).

**Question ouverte** : les trois membres doivent cocher la validation en tête de `docs/api.md`.

### DL-07 · Design system — terminé

Jetons Tailwind, douze composants dans `components/ui/`, navigation responsive, page de démonstration sur `/design`.

**Écart important** : `eslint-plugin-jsx-a11y`, imposé par notre cahier, dépend de `axe-core` (MPL-2.0), interdite par le règlement. Le contrôle de licences l'a détecté. Plugin retiré, remplacé par six règles maison, chacune vérifiée sur un cas de faute. Voir `docs/DECISIONS.md`.

### DL-08 · Inscription et connexion — terminé

Contexte de session, client d'API avec renouvellement automatique du jeton, garde de routes, erreurs serveur affichées champ par champ.

### DL-05 · Fichiers de déploiement — préparés

`backend/Dockerfile`, `frontend/Dockerfile`, `deploy/nginx.conf` (avec CSP), `docker-compose.prod.yml`, `deploy/README.md`, `deploy/backup.sh`, `deploy/healthcheck.sh`. **La commande du VPS et la mise en ligne restent à Achraf.**

---

## Phase 2 · Cœur fonctionnel — **terminée, jalon atteint**

> **Jalon** : la boucle complète fonctionne de bout en bout. Vérifié par `backend/tests/test_parcours_demo.py`, qui rejoue les huit étapes du parcours de démonstration.

### DL-11 · Moteur de Dev Match — terminé

**Écart majeur** : le ticket demandait de « reprendre `matching/scoring.py` du squelette ». **Ce fichier n'existait pas** : le dépôt était vide au départ, il n'y a jamais eu de squelette. L'algorithme a donc été **écrit**, à partir des six poids donnés par le cahier et des cas limites du ticket.

**À relire ligne à ligne par Omar**, puisqu'il le défendra à l'oral.

Résultats mesurés : un échange réciproque dépasse 90, un sens unique plafonne à 55. Vérifié par balayage exhaustif de toutes les combinaisons. 76 tests.

**Décision prise seul** : `ONE_WAY_CAP = 55`, validée par l'équipe le 2026-10-08.

### DL-12 · Données de démonstration — terminé

20 profils fictifs sur **15 pays** (8 demandés), 8 projets, 181 matchs dont **9 au-dessus de 75 %** et 65 partiels (3 et 3 demandés). Commande idempotente.

### DL-14, DL-15, DL-16, DL-17, DL-18, DL-19 · API du cœur — terminés

Profil, compétences, preuves, projets, demandes pour rejoindre, échanges, permissions.

**Choix notables** :
- `pair_key` normalisée sur `Exchange` : la contrainte « une seule demande en attente par paire » tient dans les deux sens, même avec des requêtes simultanées.
- Contrainte **conditionnelle** sur les demandes de projet : un refus n'interdit pas une candidature ultérieure.
- 404 plutôt que 403 sur les ressources d'autrui, pour empêcher l'énumération.

**Défaut trouvé par les tests** : une requête N+1 sur le profil public (9 requêtes pour 5 compétences). Corrigé par un `Prefetch` annoté ; le profil tient maintenant en 3 requêtes constantes.

### DL-24, DL-25, DL-26, DL-27, DL-38, DL-39 · Matching, recherche, pays — terminés

L'explication du match est **orientée selon le lecteur** : « il peut vous apprendre » reste juste pour les deux membres de la paire, alors qu'elle n'est stockée qu'une fois.

La recherche n'utilise **aucune fonction propre à PostgreSQL** : les tests passent aussi sur SQLite, ce qui prouve la portabilité.

### DL-20, DL-21, DL-22, DL-23, DL-33, DL-36 · Écrans — terminés

**Deux défauts réels trouvés par les tests** :
- la modale volait le focus du champ en cours de saisie à chaque frappe, car `onClose` changeait d'identité et relançait l'effet ;
- le hook de chargement provoquait des rendus en cascade (`setState` dans le corps d'un effet).

---

## Phase 3 · Compléments — **terminée**

### DL-28 · Dashboard agrégé — terminé

Un seul appel renvoie tout l'écran. Nombre de requêtes stable quel que soit le volume de données.

### DL-29 · Durcissement sécurité — terminé

`check --deploy` ne signale **aucun** avertissement. 34 tests de sécurité : injections SQL, XSS, en-têtes, absence de SQL brut, absence de clé par défaut, contrôle d'accès (IDOR).

**Défaut trouvé** : après modification du profil, la réponse renvoyait l'ancienne valeur, la vue sérialisant une instance différente de celle écrite.

**Défaut trouvé dans notre propre outillage** : le scan de secrets ne détectait rien, ses motifs étant écrits en syntaxe BRE alors que `git grep -E` attend de l'ERE. Corrigé et vérifié sur de faux secrets.

### DL-30 · Surveillance et sauvegardes — préparé

`/health/?detail=1` vérifie la base et les migrations. `deploy/backup.sh` (14 jours de rétention, échoue si la sauvegarde est anormalement petite) et `deploy/healthcheck.sh` (une seule alerte par panne).

**Reste à faire par Achraf, sur le serveur** : installer la crontab, et **tester une restauration** (critère d'acceptation). Procédure dans `deploy/README.md`.

### DL-31, DL-32, DL-34, DL-35, DL-37, DL-40 · Compléments — terminés

Preuves de compétence, signalement avec plafond journalier, responsive et accessibilité, carte de l'Afrique en tuiles, export et suppression de compte.

**Écart** : la carte est une grille de tuiles, non un SVG géographique. Les fichiers de contours disponibles sont sous licence non permissive ou sans licence claire. Justifié dans `docs/DECISIONS.md`.

---

## Phase 4 · IA — **terminée, désactivée par défaut**

### DL-43 · Couche d'abstraction — terminé

`backend/ai/client.py`. **Aucune dépendance ajoutée** : appels par `urllib` de la bibliothèque standard, car les SDK et `requests`/`httpx` tirent `certifi` (MPL-2.0), interdite par le règlement. Le contrôle de licences reste à zéro problème.

`AI_ENABLED=False` par défaut. Un test vérifie, route par route, que le produit est entièrement utilisable sans IA.

### DL-41 · Limites et budget — terminé

Plafond journalier global (`AI_DAILY_LIMIT`, 200 par défaut) et limite horaire par utilisateur (20). Un dépassement renvoie `503 ai_quota_exceeded`, donc au chemin classique, jamais une erreur bloquante.

### DL-44 à DL-47 · Les quatre fonctions — terminées

Extraction de compétences, recherche en langage naturel, résumé de projet, explication reformulée.

**Principe appliqué partout** : l'IA propose, l'utilisateur valide. Aucune fonction n'écrit en base.

**Garde-fou** : les suggestions sont contraintes au catalogue et aux énumérations. Des tests le vérifient avec des valeurs absurdes (« COBOL », « Wakanda », « GURU »), écartées en silence.

**Données personnelles** : ni adresse, ni identifiant, ni nom envoyés au service. La clé part en en-tête, jamais dans le corps. Deux tests le vérifient.

### DL-42 · Interface — terminé

Les composants d'IA **ne s'affichent pas** quand le service est inactif : nous ne proposons jamais un bouton qui échouera. Chacun a un état « IA indisponible » qui renvoie au formulaire classique, sans dramatiser.

**Ce qu'il reste à faire** : obtenir une clé d'API et la mettre dans `backend/.env` (`AI_ENABLED=True`, `AI_API_KEY=...`). Je ne peux pas l'obtenir, et elle ne doit jamais être commitée. Le parcours de démonstration ne dépend d'aucune de ces fonctions.

---

## Phase 5 · Finalisation — **partiellement faite**

| Ticket | État |
|---|---|
| DL-54 · Test de bout en bout | **Terminé** : les 8 étapes rejouées par l'API |
| DL-50 · AI_USAGE et LICENSES finaux | **Terminé** |
| DL-56 · README final | **Terminé** (captures d'écran à ajouter par Emmanuel) |
| DL-59 · Audit des licences | **Terminé** : 0 licence non permissive |
| DL-48 · Version de production figée | **Attend le déploiement** |
| DL-49, DL-55, DL-60 · Corrections | **Attend les retours de test sur l'URL publique** |
| DL-51 · Soumission | **Achraf**, au plus tard le 24 octobre |

---

## Renforcement avant soumission (2026-10-08) — **terminé**

| Sujet | Ce qui a été fait |
|---|---|
| Contact après acceptation | Un échange accepté ne débloquait rien : aucun des deux ne pouvait joindre l'autre. Champ `contact` (e-mail ou lien `https`), révélé aux deux seulement une fois l'échange `ACCEPTED` ou `COMPLETED`. Absent du profil public, inclus dans l'export. |
| Demandes en attente | Pastille dans la barre de navigation, à côté de « Échanges ». |
| Premiers pas | Liste guidée sur le tableau de bord d'un nouveau compte ; disparaît une fois tout fait. |
| Bug corrigé | Les compteurs d'échanges en attente du tableau de bord étaient calculés sur l'aperçu limité à 5 : faux au-delà. |
| Test navigateur | Parcours de démonstration rejoué dans Chromium (Playwright), en CI. |
| Mobile | 18 écrans vérifiés à 390 px ; trois débordements et deux mises en page écrasées corrigés. |
| Design | Surfaces douces, avatars, jauge de score, navbar flottante, accueil enrichi (voir `DECISIONS.md`). |
| Documentation | Captures dans le README, `api.md` (modifications après le gel listées en tête), `EXPLICATION_JURY.md`, `demo.md`, politique de confidentialité. |

---

## Ce qui nous distingue (2026-10-09) — **terminé**

| Sujet | Ce qui a été fait |
|---|---|
| Cercles d'échange | Quand aucune paire ne se complète, un cycle de 3 ou 4 personnes où chacun apprend au suivant. Algorithme pur (`circles/finder.py`), contacts révélés quand tous ont accepté. Démo : Dakar → Accra → Nairobi. |
| Observatoire | Page publique : offre et demande par compétence, manques, savoirs à partager, ponts entre pays. Que des comptes. |
| Validations par les pairs | Après un échange terminé ou dans un cercle actif, on valide la compétence vue à l'œuvre ; visible sur le profil public. |
| Interface en anglais | Bouton `FR`/`EN` ; toute l'interface, les messages d'erreur de l'API, les raisons d'un match et les textes de l'IA suivent. Tests d'exhaustivité côté frontend et backend. |
| Tests | 544 backend, 240 frontend, 3 scénarios navigateur. |

---

## À faire par l'équipe (hors de ma portée)

Liste à cocher, par personne et par date : **[AVANT_SOUMISSION.md](AVANT_SOUMISSION.md)**.

### Urgent

- **DL-10** (Omar) : courriel à l'organisateur. **Échéance dépassée** (6 octobre). Ses réponses conditionnent DL-59, notamment sur la MPL-2.0.
- **DL-01** (Achraf) : protéger `main` dans les réglages GitHub (PR obligatoire, 1 relecture, CI verte).
- **DL-04** : valider le contrat d'API à trois, en cochant l'en-tête de `docs/api.md`.

### Ensuite

- **DL-05** (Achraf) : commander le VPS **à Dakar** (le code promotionnel n'est valable que là), suivre `deploy/README.md`.
- **DL-09** (Emmanuel) : maquettes des 4 écrans. Les écrans existent déjà : les maquettes serviraient à les améliorer, pas à les créer.
- **DL-30** (Achraf) : installer les sauvegardes et **tester une restauration**.
- **DL-52, DL-57, DL-61** : chacun répète sa partie, deux fois au minimum. `docs/EXPLICATION_JURY.md` prépare les réponses.
- **DL-53, DL-58, DL-62** : déclarations de titularité.
- **DL-63, DL-64, DL-65** : voter entre le 25 octobre 18 h et le 26 octobre 23 h 59. **Un seul oubli exclut toute l'équipe.**

### Relecture prioritaire du code produit avec l'IA

1. `backend/matching/scoring.py` et `backend/matching/services.py` → Omar
2. `frontend/src/features/matches/components/MatchExplanation.tsx` → Emmanuel
3. `backend/config/settings.py` et `docs/securite.md` → Achraf
4. `backend/circles/finder.py` et `backend/skills/endorsements.py` → Omar
5. `frontend/src/i18n/` et la traduction anglaise (`en.ts`) → Emmanuel
