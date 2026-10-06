# API DevLink Africa

Base : `/api/v1/`. Documentation interactive : `/api/docs/` ; schéma OpenAPI : `/api/schema/`.

## Conventions

- Format JSON, authentification par jeton JWT : `Authorization: Bearer <access_token>`.
- Toutes les routes exigent une authentification, sauf mention contraire.
- Les listes sont paginées (`count`, `next`, `previous`, `results`, 20 éléments par page).
- Limitation de débit : anonyme 60/min, utilisateur 300/min, portée `auth` (connexion, inscription) 5/min.

## Routes disponibles

### `GET /api/v1/health/` (public)

Réponse `200` :

```json
{ "status": "ok", "version": "0.1.0" }
```

## Routes à venir

Les autres routes sont définies dans les tickets (voir les TODO dans `backend/config/urls.py`).
