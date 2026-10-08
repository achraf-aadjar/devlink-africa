# Contrat d'API DevLink Africa (v1)

**État : gelé le 2026-10-07 (DL-04).** Après le gel, toute modification passe par une pull request et l'accord des trois membres. Ce fichier est la source de vérité : le code et le schéma OpenAPI doivent s'y conformer.

- Base : `/api/v1/`
- Documentation interactive : `/api/docs/` · schéma OpenAPI : `/api/schema/`
- Validé par : Achraf ☐ · Emmanuel ☐ · Omar ☐ *(cocher en relecture de la PR)*

**Modifications après le gel** (ajouts seulement, aucun champ retiré ni renommé ; à valider par les trois en relecture de PR) :

| Date | Route | Changement |
|---|---|---|
| 2026-10-08 | `GET /me/`, `PATCH /me/`, `GET /me/export/` | Champ `profile.contact` : adresse e-mail ou lien `https`, facultatif |
| 2026-10-08 | `GET /exchanges/`, `PATCH /exchanges/{id}/`, `POST /matches/{id}/request/` | Champ `contact` sur `requester` et `partner`, rempli seulement si l'échange est `ACCEPTED` ou `COMPLETED` |
| 2026-10-08 | `GET /dashboard/` | Champs `has_contact` et `counters.exchanges` ; `pending_exchanges.received` et `sent` comptés en base, plus sur l'aperçu |

## Sommaire

1. [Conventions](#1-conventions)
2. [Erreurs](#2-erreurs)
3. [Authentification](#3-authentification-dl-03)
4. [Profil](#4-profil-dl-14)
5. [Compétences](#5-compétences-dl-15)
6. [Preuves de compétence](#6-preuves-de-compétence-dl-31)
7. [Projets](#7-projets-dl-16)
8. [Demandes pour rejoindre un projet](#8-demandes-pour-rejoindre-un-projet-dl-17)
9. [Matching](#9-matching-dl-24)
10. [Retour sur un match](#10-retour-sur-un-match-dl-39)
11. [Échanges](#11-échanges-dl-18)
12. [Recherche](#12-recherche-dl-25)
13. [Exploration par pays](#13-exploration-par-pays-dl-38)
14. [Dashboard](#14-dashboard-dl-28)
15. [Signalement](#15-signalement-dl-32)
16. [Données personnelles](#16-données-personnelles-dl-40)
17. [Fonctions d'IA](#17-fonctions-dia-dl-43-à-dl-47)
18. [Santé](#18-santé-dl-30)
19. [Énumérations](#19-énumérations)

---

## 1. Conventions

- Tous les corps de requête et de réponse sont en JSON (`Content-Type: application/json`).
- **Authentification** : jeton JWT dans l'en-tête `Authorization: Bearer <access>`. Toutes les routes l'exigent, **sauf** celles marquées `(public)`.
- **Durée des jetons** : accès 30 minutes, rafraîchissement 7 jours. Le jeton de rafraîchissement est mis en liste noire à la déconnexion.
- **Pagination** : toute liste est paginée.
  ```json
  { "count": 42, "next": "/api/v1/projects/?page=3", "previous": "/api/v1/projects/?page=1", "results": [] }
  ```
  Paramètres : `page` (défaut 1), `page_size` (défaut 20, maximum 100).
- **Tri** : paramètre `ordering`, préfixe `-` pour l'ordre décroissant (exemple `?ordering=-created_at`).
- **Dates** : ISO 8601 en UTC (`2026-10-07T14:30:00Z`).
- **Identifiants** : entiers.
- **Limitation de débit** : anonyme 60/min, utilisateur connecté 300/min, routes `/auth/*` **5/min par IP**, `/reports` 10/jour, fonctions d'IA selon DL-41. Au dépassement : `429` avec l'en-tête `Retry-After`.
- **URLs fournies par l'utilisateur** : le schéma `https` est obligatoire.
- **Confidentialité** : l'adresse e-mail n'apparaît **jamais** dans la représentation publique d'un utilisateur.

## 2. Erreurs

Format unique, produit par `core.exceptions.api_exception_handler` :

```json
{
  "detail": "Les données envoyées sont invalides.",
  "code": "invalid",
  "errors": { "password": ["Le mot de passe doit contenir au moins 10 caractères."] }
}
```

`errors` n'est présent que pour les erreurs de validation. `code` est lisible par la machine, `detail` par l'utilisateur (en français).

| Statut | Quand | `code` typique |
|---|---|---|
| `400` | Données invalides, champ inconnu | `invalid` |
| `401` | Jeton absent, expiré, ou identifiants faux | `invalid_credentials`, `token_not_valid` |
| `403` | Connecté mais sans droit sur la ressource | `permission_denied` |
| `404` | Ressource inexistante, ou appartenant à un autre (anti-énumération) | `not_found` |
| `409` | Conflit avec l'état actuel | `email_already_used`, `duplicate_request` |
| `429` | Limite de débit atteinte | `throttled` |

> Note : les champs non déclarés sont **refusés** (`400`), ils ne sont pas ignorés.

---

## 3. Authentification (DL-03)

### `POST /auth/register/` (public)

Crée un compte et son profil vide. Consentement explicite obligatoire (loi n° 2008-12).

```json
{
  "email": "ada@example.org",
  "password": "mot-de-passe-solide-2026",
  "full_name": "Ada Lovelace",
  "consent": true
}
```

`201` :

```json
{
  "access": "eyJhbGciOi...",
  "refresh": "eyJhbGciOi...",
  "user": { "id": 1, "email": "ada@example.org", "full_name": "Ada Lovelace", "date_joined": "2026-10-07T09:00:00Z" }
}
```

Erreurs : `400` (mot de passe de moins de 10 caractères, trop proche de l'e-mail, consentement refusé, e-mail invalide), `409` `email_already_used`, `429`.

### `POST /auth/login/` (public)

```json
{ "email": "ada@example.org", "password": "mot-de-passe-solide-2026" }
```

`200` : même corps que l'inscription. `401` `invalid_credentials` pour un mot de passe faux, une adresse inconnue **ou** un compte désactivé — la réponse est identique dans les trois cas, afin de ne pas révéler l'existence d'un compte.

### `GET /auth/google/client-id/` (public)

`200` : `{ "client_id": "..." }`, chaîne vide si la connexion avec Google n'est pas configurée. Ce n'est pas un secret (il part aussi vers le navigateur pour afficher le bouton) : l'interface masque simplement le bouton « Continuer avec Google » tant que la valeur est vide.

### `POST /auth/google/` (public)

Connecte ou crée un compte à partir d'un jeton d'identité Google (vérifié côté serveur : signature, émetteur, audience, adresse vérifiée par Google).

```json
{ "credential": "eyJhbGciOi..." }
```

`200` : même corps que l'inscription. Un compte créé ainsi n'a pas de mot de passe tant que la personne n'en choisit pas un depuis son profil. Si l'adresse correspond déjà à un compte existant (créé par mot de passe ou par Google), on s'y connecte simplement.

Erreurs : `400` `google_token_invalid` (jeton invalide, expiré, ou destiné à une autre application) ou `google_email_unverified` (adresse non vérifiée par Google) ; `503` `google_not_configured` si aucun identifiant client n'est renseigné côté serveur.

### `POST /auth/refresh/` (public)

```json
{ "refresh": "eyJhbGciOi..." }
```

`200` : `{ "access": "eyJhbGciOi...", "refresh": "eyJhbGciOi..." }` (le jeton de rafraîchissement est renouvelé et l'ancien révoqué). `401` si révoqué ou expiré.

### `POST /auth/logout/`

```json
{ "refresh": "eyJhbGciOi..." }
```

`204` sans corps. Le jeton de rafraîchissement est mis en liste noire. `400` s'il est invalide ou déjà révoqué, `401` sans jeton d'accès.

---

## 4. Profil (DL-14)

### `GET /me/`

`200` — vue privée, avec l'e-mail :

```json
{
  "id": 1,
  "email": "ada@example.org",
  "full_name": "Ada Lovelace",
  "profile": {
    "country": "SN",
    "bio": "Développeuse web à Dakar.",
    "availability": ["MENTORING", "COLLABORATION"],
    "domains": ["WEB", "DATA"],
    "avatar_url": "https://example.org/a.png",
    "contact": "https://github.com/ada",
    "is_demo": false,
    "completeness": 80
  }
}
```

`completeness` est un pourcentage calculé côté serveur (profil renseigné, compétences déclarées).

`contact` est le moyen de joindre l'utilisateur : une adresse e-mail ou un lien `https` (GitHub, LinkedIn…), ou une chaîne vide. Il n'apparaît **jamais** sur le profil public : seuls les partenaires d'un échange accepté le voient (§ 11).

### `PATCH /me/`

Modification partielle du profil (et de `full_name`). Seul le propriétaire peut modifier son profil.

```json
{ "country": "CI", "bio": "Développeuse mobile.", "availability": ["FREELANCE"], "domains": ["MOBILE"] }
```

`200` : le profil complet. `400` pour un pays hors ISO 3166-1 alpha-2, une valeur hors énumération, une bio de plus de 1000 caractères, une `avatar_url` non `https`, ou un `contact` qui n'est ni une adresse e-mail ni un lien `https` (`javascript:`, `http:` et texte libre sont refusés).

### `GET /users/{id}/` — profil public

`200` — **sans e-mail** :

```json
{
  "id": 2,
  "full_name": "Kofi Mensah",
  "country": "GH",
  "bio": "Backend Python.",
  "availability": ["MENTORING"],
  "domains": ["WEB"],
  "avatar_url": "",
  "is_demo": true,
  "skills": {
    "offered": [{ "skill": { "id": 6, "name": "Python" }, "level": "ADVANCED", "proofs_count": 2 }],
    "wanted": [{ "skill": { "id": 3, "name": "TypeScript" }, "level": "BEGINNER", "proofs_count": 0 }]
  },
  "projects": [{ "id": 4, "title": "Agri-Data", "status": "OPEN" }]
}
```

`404` si l'utilisateur n'existe pas ou est désactivé.

---

## 5. Compétences (DL-15)

### `GET /skills/` (public)

Catalogue, filtrable par `?category=` et `?search=`.

`200` :

```json
{
  "count": 14,
  "next": null,
  "previous": null,
  "results": [
    { "id": 1, "name": "React", "category": "FRONTEND" },
    { "id": 6, "name": "Python", "category": "BACKEND" }
  ]
}
```

### `GET /me/skills/`

`200` : `{ "offered": [...], "wanted": [...] }`, chaque entrée étant un `UserSkill` (voir ci-dessous).

### `POST /me/skills/`

```json
{ "skill": 6, "kind": "OFFERED", "level": "ADVANCED" }
```

`201` :

```json
{ "id": 11, "skill": { "id": 6, "name": "Python", "category": "BACKEND" }, "kind": "OFFERED", "level": "ADVANCED", "proofs": [] }
```

`409` `duplicate_skill` si le triplet (utilisateur, compétence, type) existe déjà. `400` pour un niveau ou un type hors énumération.

**Effet de bord** : l'ajout ou la suppression déclenche le recalcul **incrémental** des matchs de cet utilisateur (DL-24).

### `PATCH /me/skills/{id}/`

`{ "level": "INTERMEDIATE" }` → `200`. Seul le propriétaire ; sinon `404`.

### `DELETE /me/skills/{id}/`

`204`. Seul le propriétaire ; sinon `404`.

---

## 6. Preuves de compétence (DL-31)

### `GET /me/skills/{user_skill_id}/proofs/`

`200` : liste paginée de preuves.

### `POST /me/skills/{user_skill_id}/proofs/`

```json
{ "kind": "GITHUB_REPO", "title": "API de collecte agricole", "url": "https://example.org/depot", "description": "Auteur principal." }
```

`201` :

```json
{ "id": 3, "kind": "GITHUB_REPO", "title": "API de collecte agricole", "url": "https://example.org/depot", "description": "Auteur principal.", "created_at": "2026-10-17T10:00:00Z" }
```

Plusieurs preuves par compétence sont permises. `400` si l'URL n'est pas en `https`. `404` si la compétence appartient à un autre utilisateur.

### `DELETE /me/skills/{user_skill_id}/proofs/{id}/`

`204`. Seul le propriétaire.

---

## 7. Projets (DL-16)

### `GET /projects/` (public)

Filtres : `?country=`, `?skill=` (identifiant ou nom), `?status=`, `?search=`, `?owner=`.

`200` :

```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 4,
      "title": "Agri-Data",
      "description": "Collecte de données agricoles hors ligne.",
      "status": "OPEN",
      "needs": [{ "id": 6, "name": "Python" }, { "id": 9, "name": "Docker" }],
      "repo_url": "https://example.org/agri-data",
      "demo_url": "",
      "owner": { "id": 2, "full_name": "Kofi Mensah", "country": "GH", "is_demo": true },
      "join_requests_count": 3,
      "created_at": "2026-10-10T08:00:00Z"
    }
  ]
}
```

### `POST /projects/`

```json
{
  "title": "Agri-Data",
  "description": "Collecte de données agricoles hors ligne.",
  "needs": [6, 9],
  "status": "OPEN",
  "repo_url": "https://example.org/agri-data",
  "demo_url": ""
}
```

`201` : le projet. `400` si `title` est vide ou dépasse 150 caractères, si `description` dépasse 5000 caractères, ou si une URL n'est pas en `https`.

### `GET /projects/{id}/` (public)

`200` : le projet, plus `join_requests` si le demandeur en est le propriétaire.

### `PATCH /projects/{id}/` · `DELETE /projects/{id}/`

Réservé au propriétaire : `200` / `204`. Pour un autre utilisateur : `404`.

---

## 8. Demandes pour rejoindre un projet (DL-17)

### `POST /projects/{id}/join/`

```json
{ "message": "Je peux prendre la partie Docker." }
```

`201` :

```json
{ "id": 7, "project": 4, "applicant": { "id": 1, "full_name": "Ada Lovelace" }, "message": "Je peux prendre la partie Docker.", "status": "PENDING", "created_at": "2026-10-14T11:00:00Z" }
```

`409` `duplicate_request` s'il existe déjà une demande en attente. `400` si le propriétaire tente de rejoindre son propre projet.

### `GET /projects/{id}/join-requests/`

Réservé au propriétaire du projet : il ne voit que les demandes de **ses** projets. `200` : liste paginée. `404` sinon.

### `PATCH /join-requests/{id}/`

```json
{ "status": "ACCEPTED" }
```

Valeurs acceptées : `ACCEPTED`, `DECLINED`. Réservé au propriétaire du projet. `200`, ou `404`, ou `409` si la demande est déjà traitée.

---

## 9. Matching (DL-24)

### `GET /matches/`

Liste des matchs de l'utilisateur connecté, triée par score décroissant, paginée.

`200` :

```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 31,
      "user": { "id": 2, "full_name": "Kofi Mensah", "country": "GH", "avatar_url": "", "is_demo": true },
      "score": 82.5,
      "reasons": [
        "Kofi peut vous apprendre Python (niveau avancé).",
        "Vous pouvez lui apprendre TypeScript.",
        "Vous êtes tous les deux disponibles pour du mentorat."
      ],
      "computed_at": "2026-10-15T09:00:00Z"
    }
  ]
}
```

### `GET /matches/{id}/`

Détail avec la répartition du score. L'utilisateur connecté doit faire partie de la paire, sinon `404`.

```json
{
  "id": 31,
  "user": { "id": 2, "full_name": "Kofi Mensah", "country": "GH", "avatar_url": "", "is_demo": true },
  "score": 82.5,
  "explanation": {
    "breakdown": [
      { "criterion": "complementarity", "label": "Complémentarité", "weight": 35, "points": 31.5 },
      { "criterion": "reciprocity", "label": "Réciprocité", "weight": 20, "points": 20.0 },
      { "criterion": "collaboration", "label": "Envie de collaborer", "weight": 15, "points": 11.0 },
      { "criterion": "common_tech", "label": "Technologies communes", "weight": 10, "points": 10.0 },
      { "criterion": "availability", "label": "Disponibilité", "weight": 10, "points": 5.0 },
      { "criterion": "domain", "label": "Domaine", "weight": 10, "points": 5.0 }
    ],
    "they_can_teach_you": [{ "id": 6, "name": "Python", "level": "ADVANCED" }],
    "you_can_teach_them": [{ "id": 3, "name": "TypeScript", "level": "INTERMEDIATE" }],
    "common_skills": [{ "id": 9, "name": "Docker" }],
    "reasons": ["Kofi peut vous apprendre Python (niveau avancé)."]
  },
  "my_feedback": null,
  "computed_at": "2026-10-15T09:00:00Z"
}
```

Le score va de 0 à 100. La somme des `points` égale le score. Un match **à sens unique** (sans réciprocité) est plafonné et ne peut pas atteindre un score élevé.

> Le recalcul est incrémental : il a lieu à l'inscription et à chaque changement de compétences, et ne porte que sur les paires concernées.

---

## 10. Retour sur un match (DL-39)

### `POST /matches/{id}/feedback/`

```json
{ "is_relevant": true, "comment": "Profil très proche de ce que je cherche." }
```

`201` : `{ "id": 5, "match": 31, "is_relevant": true, "comment": "...", "created_at": "2026-10-19T12:00:00Z" }`

Un seul retour par utilisateur et par match : `409` `duplicate_feedback` ensuite. Ce retour est stocké pour analyse et **n'influence pas** le score.

---

## 11. Échanges (DL-18)

### `POST /matches/{id}/request/`

Propose un échange à l'autre membre de la paire.

```json
{ "type": "MENTORAT", "message": "Bonjour Kofi, peux-tu m'aider à démarrer avec Python ?", "skill": 6 }
```

`201` :

```json
{
  "id": 9,
  "type": "MENTORAT",
  "status": "PROPOSED",
  "message": "Bonjour Kofi, peux-tu m'aider à démarrer avec Python ?",
  "skill": { "id": 6, "name": "Python" },
  "requester": { "id": 1, "full_name": "Ada Lovelace", "contact": null },
  "partner": { "id": 2, "full_name": "Kofi Mensah", "contact": null },
  "scheduled_at": null,
  "created_at": "2026-10-15T14:00:00Z"
}
```

**`contact`** vaut `null` tant que l'échange n'est pas accepté. Dès qu'il passe à `ACCEPTED` (puis `COMPLETED`), chaque participant porte le `contact` de son profil (ou `null` s'il n'en a pas renseigné) : l'acceptation vaut accord pour être joint. Un échange refusé ou annulé ne révèle jamais rien.

Règles : `message` obligatoire (1 à 1000 caractères) ; une seule demande en attente par paire d'utilisateurs (`409` `duplicate_request`) ; on ne peut pas se proposer un échange à soi-même (`400`).

### `GET /exchanges/`

`?direction=received|sent` (défaut : les deux), `?status=`. `200` : liste paginée, visible par les deux personnes concernées.

### `PATCH /exchanges/{id}/`

```json
{ "status": "ACCEPTED" }
```

- `ACCEPTED` et `DECLINED` : réservés au **destinataire** (`partner`).
- `CANCELLED` : réservé au demandeur, tant que le statut est `PROPOSED`.
- `COMPLETED` : les deux, après `ACCEPTED`.

`200`, ou `403` si l'on n'a pas le rôle requis, ou `409` pour une transition impossible.

---

## 12. Recherche (DL-25)

### `GET /search/users/` (public)

Paramètres : `q` (nom, bio), `country`, `skill`, `skill_wanted`, `level`, `availability`, `domain`, `is_demo`. Combinables.

`200` :

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 2,
      "full_name": "Kofi Mensah",
      "country": "GH",
      "bio": "Backend Python.",
      "avatar_url": "",
      "is_demo": true,
      "availability": ["MENTORING"],
      "offered_skills": [{ "id": 6, "name": "Python" }],
      "wanted_skills": [{ "id": 3, "name": "TypeScript" }]
    }
  ]
}
```

### `GET /search/projects/` (public)

Paramètres : `q` (titre, description), `country`, `skill`, `status`. Même forme de réponse que `GET /projects/`.

---

## 13. Exploration par pays (DL-38)

### `GET /countries/` (public)

`200` :

```json
{
  "results": [
    { "code": "SN", "name": "Sénégal", "flag": "🇸🇳", "developers_count": 6, "projects_count": 3 },
    { "code": "CI", "name": "Côte d'Ivoire", "flag": "🇨🇮", "developers_count": 4, "projects_count": 2 }
  ]
}
```

### `GET /countries/{code}/` (public)

```json
{
  "code": "SN",
  "name": "Sénégal",
  "flag": "🇸🇳",
  "developers_count": 6,
  "projects_count": 3,
  "top_skills": [{ "id": 6, "name": "Python", "count": 4 }],
  "developers": [],
  "projects": []
}
```

`code` est un code ISO 3166-1 alpha-2. Un pays sans donnée renvoie `200` avec des compteurs à zéro et des listes vides (ce n'est pas une erreur).

---

## 14. Dashboard (DL-28)

### `GET /dashboard/`

Une seule requête fournit tout l'écran d'accueil connecté.

`200` :

```json
{
  "profile_completeness": 80,
  "has_contact": false,
  "recommended_matches": [{ "id": 31, "user": { "id": 2, "full_name": "Kofi Mensah" }, "score": 82.5 }],
  "pending_exchanges": { "received": 2, "sent": 1, "items": [] },
  "pending_join_requests": { "count": 3, "items": [] },
  "my_projects": [{ "id": 4, "title": "Agri-Data", "status": "OPEN", "join_requests_count": 3 }],
  "counters": { "offered_skills": 5, "wanted_skills": 3, "matches": 12, "exchanges": 4 }
}
```

Les listes sont tronquées (5 éléments au maximum) : ce sont des aperçus, chaque bloc renvoyant vers la page complète. Les compteurs (`pending_exchanges.received`, `sent`, `counters.*`) sont, eux, toujours calculés sur la totalité. `counters.exchanges` compte les échanges de l'utilisateur, tous statuts confondus ; avec `has_contact`, il alimente la liste « Vos premiers pas ».

---

## 15. Signalement (DL-32)

### `POST /reports/`

```json
{ "target_type": "USER", "target_id": 2, "reason": "SPAM", "details": "Messages publicitaires répétés." }
```

`201` : `{ "id": 2, "status": "OPEN", "created_at": "2026-10-18T15:00:00Z" }`

`target_type` vaut `USER` ou `PROJECT`. Un seul signalement par personne et par cible (`409` `duplicate_report`). On ne peut pas se signaler soi-même (`400`). Limite : 10 signalements par jour.

---

## 16. Données personnelles (DL-40)

### `GET /me/export/`

Export complet des données de l'utilisateur connecté (droit d'accès, loi n° 2008-12).

`200` : `{ "exported_at": "...", "user": {}, "profile": {}, "skills": [], "projects": [], "exchanges": [], "reports_made": [] }`

### `DELETE /me/`

Suppression du compte et de toutes les données liées (droit d'effacement).

```json
{ "password": "mot-de-passe-solide-2026" }
```

`204`. Le mot de passe est redemandé pour confirmer. `400` s'il est faux.

---

## 17. Fonctions d'IA (DL-43 à DL-47)

**L'IA est facultative.** Avec `AI_ENABLED=false`, ces routes répondent `503` avec `{"detail": "...", "code": "ai_unavailable"}`, et l'interface propose le formulaire classique. Aucune fonction principale n'en dépend.

### `GET /ai/status/`

`200` : `{ "enabled": true, "features": ["skill_extraction", "natural_search", "project_summary", "match_explanation", "copilot"] }`

### `POST /ai/extract-skills/`

`{ "text": "Je fais du Django depuis 3 ans et je veux apprendre Flutter." }`

`200` : `{ "suggestions": { "offered": [{ "skill": 6, "name": "Python", "level": "ADVANCED" }], "wanted": [{ "skill": 4, "name": "Flutter" }] } }`

**Rien n'est enregistré** : l'utilisateur valide ensuite via `POST /me/skills/`.

### `POST /ai/search/`

`{ "query": "un dev React au Sénégal qui veut apprendre Docker" }`

`200` : `{ "criteria": { "skill": "React", "country": "SN", "skill_wanted": "Docker" }, "results": {} }`

Les critères sont affichés et modifiables par l'utilisateur.

### `POST /ai/summarize-project/`

`{ "description": "..." }` → `200` : `{ "summary": "..." }`. Le propriétaire valide avant enregistrement.

### `POST /ai/explain-match/`

`{ "match": 31 }` → `200` : `{ "sentence": "..." }`. Les raisons calculées restent la source de vérité ; cette phrase ne fait que les reformuler.

En cas de dépassement de quota : `429` `ai_quota_exceeded`, et le produit continue de fonctionner sans IA (DL-41).

### `POST /ai/copilot/`

DevLink Copilot : question libre sur l'utilisation de la plateforme (bulle flottante).

```json
{
  "message": "Comment je complète mon profil ?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

`200` : `{ "reply": "..." }`. `history` est optionnel (6 derniers tours au plus pris en compte) et n'est jamais stocké côté serveur — c'est le navigateur qui le renvoie à chaque appel pour garder le fil d'une discussion. Purement conversationnel : ne lit ni n'écrit aucune donnée du compte.

---

## 18. Santé (DL-30)

### `GET /health/` (public)

`200` :

```json
{ "status": "ok", "version": "0.1.0" }
```

Avec `?detail=1` (DL-30) : ajoute l'état de la base et la version du schéma. Renvoie `503` si une dépendance est indisponible.

---

## 19. Énumérations

Toute valeur hors de ces listes est refusée (`400`).

| Énumération | Valeurs |
|---|---|
| `availability` | `MENTORING`, `COLLABORATION`, `OPEN_SOURCE`, `FREELANCE` |
| `domains` | `WEB`, `MOBILE`, `DATA`, `DEVOPS`, `DESIGN`, `IA`, `SECURITE`, `EMBARQUE` |
| `UserSkill.kind` | `OFFERED`, `WANTED` |
| `UserSkill.level` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `Skill.category` | `FRONTEND`, `BACKEND`, `MOBILE`, `DATA`, `DEVOPS`, `DESIGN`, `AUTRE` |
| `SkillProof.kind` | `PROJECT`, `GITHUB_REPO`, `OPEN_SOURCE`, `CERTIFICATION`, `CHALLENGE` |
| `Project.status` | `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CLOSED` |
| `ProjectJoinRequest.status` | `PENDING`, `ACCEPTED`, `DECLINED` |
| `Exchange.type` | `PAIR_PROGRAMMING`, `CODE_REVIEW`, `MENTORAT`, `DEBUGGING`, `PROJET_COMMUN`, `PREPARATION_ENTRETIEN`, `ECHANGE_COMPETENCES`, `DISCUSSION` |
| `Exchange.status` | `PROPOSED`, `ACCEPTED`, `DECLINED`, `COMPLETED`, `CANCELLED` |
| `Report.target_type` | `USER`, `PROJECT` |
| `Report.reason` | `SPAM`, `HARASSMENT`, `FAKE_PROFILE`, `INAPPROPRIATE`, `OTHER` |
| `Report.status` | `OPEN`, `REVIEWED`, `DISMISSED` |

### Poids du score de matching

Fixés dans `backend/matching/scoring.py` (constante documentée) :

| Critère | Poids |
|---|---|
| Complémentarité (ce que l'un sait et l'autre veut) | 35 % |
| Réciprocité (l'échange va dans les deux sens) | 20 % |
| Envie de collaborer (disponibilités compatibles) | 15 % |
| Technologies communes | 10 % |
| Disponibilité | 10 % |
| Domaine commun | 10 % |
