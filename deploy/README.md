# Déploiement (VPS Datacloud) — guide pour Achraf

> Ce dossier ne contient que la **préparation**. Rien n'a été commandé ni déployé, aucun secret n'est dans le dépôt.

## Architecture

- `web` : nginx (build React statique + proxy vers `/api`, `/admin`, `/static`), ports 80 et 443.
- `backend` : Gunicorn (Django), utilisateur non root, port 8000 interne uniquement.
- Base SQLite (mode WAL) dans le volume Docker `sqlite_data` monté sur `/data`.

## Étapes

1. **Commander le VPS** chez Datacloud (Linux, ≥ 1 Go de RAM) et un **nom de domaine** pointant vers son IP (enregistrement A).
2. **Sécuriser le serveur** : connexion SSH par clé uniquement, utilisateur non root, pare-feu n'autorisant que 22, 80 et 443.
3. **Installer Docker et le plugin Compose**, puis `git`.
4. **Cloner le dépôt** (branche `main`) sur le serveur.
5. **Remplacer `example.org`** par votre domaine dans `deploy/nginx.conf` (3 occurrences) et dans `deploy/.env`.
6. **Créer `deploy/.env`** : `cp deploy/.env.example deploy/.env`, puis renseigner :
   - `SECRET_KEY` : `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`
   - `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` avec le domaine (https).
7. **Obtenir le certificat TLS** (Let's Encrypt, via certbot sur l'hôte) :
   `sudo certbot certonly --webroot -w /var/www/certbot -d votre-domaine` (créez d'abord `/var/www/certbot`).
   Premier démarrage : si nginx refuse de démarrer faute de certificat, lancez d'abord certbot en mode `--standalone` (port 80 libre).
8. **Lancer** : `docker compose -f docker-compose.prod.yml up -d --build`.
   Les migrations s'exécutent au démarrage du conteneur `backend`.
9. **Créer l'administrateur** : `docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser`.
10. **Vérifier** : `curl https://votre-domaine/api/v1/health/` doit renvoyer `{"status":"ok", ...}`.

## Sauvegarde de la base SQLite

```bash
docker compose -f docker-compose.prod.yml exec backend \
  python -c "import sqlite3; s=sqlite3.connect('/data/db.sqlite3'); d=sqlite3.connect('/data/backup.sqlite3'); s.backup(d)"
docker compose -f docker-compose.prod.yml cp backend:/data/backup.sqlite3 ./backup-$(date +%F).sqlite3
```

## Mise à jour

`git pull && docker compose -f docker-compose.prod.yml up -d --build`

## Limites connues

- Le throttling DRF utilise le cache local de chaque worker Gunicorn : les quotas sont donc par worker.
- Le renouvellement du certificat (`certbot renew`) est à planifier (cron/timer) ; nginx doit être rechargé ensuite.
