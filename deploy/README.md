# Déploiement sur Datacloud — guide pour Achraf

> Ce dossier ne contient que la **préparation**. Rien n'a été commandé, aucun serveur n'a été contacté, aucun secret n'est dans le dépôt.

## Architecture

```
Internet ──HTTPS──> nginx (conteneur web)
                      ├── /                     build React (fichiers statiques)
                      └── /api /admin /static   proxy vers Gunicorn
                                                    │
                                        Gunicorn (conteneur backend, 3 workers)
                                                    │
                                        PostgreSQL 17 (conteneur db, volume pg_data)
```

- Le conteneur `backend` tourne sous un **utilisateur non root** (uid 10001).
- Le conteneur `db` n'expose **aucun port** vers l'extérieur : il n'est joignable que depuis le réseau Docker interne.
- Les données vivent dans le volume Docker `pg_data`, qui survit aux redéploiements.

---

## Étapes, dans l'ordre

### 1. Commander le VPS (DL-05)

- **À Dakar obligatoirement** : le code promotionnel de 40 % ne s'applique pas aux autres régions.
- Linux, 2 Go de mémoire au minimum (PostgreSQL, Gunicorn et le build nginx tiennent dans 2 Go ; 1 Go serait juste).
- **Conserver le justificatif d'achat** : c'est une condition de recevabilité (art. 6).
- Payer jusqu'au **2 novembre au minimum**, l'URL devant rester stable jusque-là (DL-48).

### 2. Nom de domaine

Créer un enregistrement A pointant vers l'adresse IP du VPS. Attendre la propagation DNS avant de demander le certificat.

### 3. Sécuriser le serveur

```bash
# Depuis votre poste : copier votre clé publique
ssh-copy-id utilisateur@IP

# Sur le serveur
sudo adduser devlink && sudo usermod -aG sudo,docker devlink
sudo nano /etc/ssh/sshd_config
#   PasswordAuthentication no
#   PermitRootLogin no
sudo systemctl restart ssh

# Pare-feu : seulement SSH, HTTP et HTTPS
sudo ufw allow 22,80,443/tcp && sudo ufw enable
```

### 4. Installer Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker devlink   # puis se reconnecter
docker compose version            # doit répondre
```

### 5. Cloner le projet

```bash
git clone https://github.com/achraf-aadjar/devlink-africa.git
cd devlink-africa
git checkout main
```

### 6. Configurer les secrets

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

À renseigner :

| Variable | Valeur |
|---|---|
| `SECRET_KEY` | `python3 -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `DB_PASSWORD` | Un autre mot de passe long et aléatoire |
| `ALLOWED_HOSTS` | `votre-domaine` |
| `CORS_ALLOWED_ORIGINS` | `https://votre-domaine` |
| `CSRF_TRUSTED_ORIGINS` | `https://votre-domaine` |

> `deploy/.env` est exclu par `.gitignore`. **Ne le commitez jamais.** Un test de la CI échoue si un secret apparaît dans un fichier suivi.

### 7. Remplacer le domaine dans nginx

```bash
sed -i 's/example\.org/votre-domaine/g' deploy/nginx.conf
grep -c votre-domaine deploy/nginx.conf   # doit afficher 4
```

### 8. Obtenir le certificat TLS

nginx ne démarre pas sans certificat : on l'obtient donc **avant** le premier lancement.

```bash
sudo mkdir -p /var/www/certbot
sudo apt install certbot
# Le port 80 doit être libre à ce moment
sudo certbot certonly --standalone -d votre-domaine
```

Renouvellement automatique (certbot installe un timer), avec rechargement de nginx :

```bash
echo '#!/bin/sh
docker compose -f /home/devlink/devlink-africa/docker-compose.prod.yml exec -T web nginx -s reload' \
  | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### 9. Lancer

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f backend   # Ctrl+C pour sortir
```

Les migrations s'appliquent automatiquement au démarrage du conteneur `backend`.

### 10. Créer l'administrateur et les données de démonstration

```bash
C="docker compose -f docker-compose.prod.yml exec backend"
$C python manage.py createsuperuser
$C python manage.py seed_demo
```

### 11. Vérifier

```bash
curl https://votre-domaine/api/v1/health/
# {"status":"ok","version":"0.1.0"}

curl https://votre-domaine/api/v1/health/?detail=1
# vérifie aussi la base et les migrations

curl -I https://votre-domaine/        # 200, et l'application React se charge
curl -I http://votre-domaine/         # 301 vers https
```

Puis dérouler le parcours de `docs/demo.md` dans un navigateur, sur mobile et sur ordinateur.

---

## Sauvegardes (DL-30)

Le script est prêt : `deploy/backup.sh`.

```bash
# Installer dans la crontab, chaque nuit à 3 h
crontab -e
# 0 3 * * * /home/devlink/devlink-africa/deploy/backup.sh >> /var/log/devlink-backup.log 2>&1
```

Il conserve 14 jours, compresse, et **échoue si la sauvegarde est anormalement petite** (ce qui révèle un échec silencieux).

### Tester la restauration — à faire au moins une fois

Le critère d'acceptation du ticket. Ne jamais supposer qu'une sauvegarde fonctionne sans l'avoir rejouée.

```bash
C="docker compose -f docker-compose.prod.yml exec -T db"

# 1. Sauvegarder
./deploy/backup.sh

# 2. Créer une base d'essai et y restaurer
$C psql -U devlink -c "CREATE DATABASE restore_test;"
gunzip -c /var/backups/devlink/devlink-*.sql.gz | $C psql -U devlink restore_test

# 3. Vérifier que les données sont là
$C psql -U devlink restore_test -c "SELECT count(*) FROM accounts_user;"

# 4. Nettoyer
$C psql -U devlink -c "DROP DATABASE restore_test;"
```

**Noter la date de ce test** dans `docs/PROGRESS.md`.

---

## Surveillance (DL-30)

`deploy/healthcheck.sh` interroge `/health/?detail=1` et alerte par courriel.

**À installer sur une autre machine que le serveur** : sinon une panne du serveur emporte la surveillance avec elle. Un poste allumé ou un second VPS suffit.

```bash
ALERT_TO=vous@example.org */5 * * * * /chemin/healthcheck.sh https://votre-domaine
```

Il n'envoie **qu'une alerte par panne**, puis un message de rétablissement.

---

## Mise à jour

```bash
cd devlink-africa
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

## Retour arrière (DL-48)

À écrire **avant** d'en avoir besoin. Procédure :

```bash
# 1. Revenir au commit précédent
git log --oneline -5
git checkout <commit-qui-fonctionnait>

# 2. Reconstruire
docker compose -f docker-compose.prod.yml up -d --build

# 3. Si une migration doit être défaite (rare, et à éviter)
docker compose -f docker-compose.prod.yml exec backend \
  python manage.py migrate <app> <numéro_précédent>

# 4. Si les données sont corrompues : restaurer la dernière sauvegarde
docker compose -f docker-compose.prod.yml stop backend
gunzip -c /var/backups/devlink/devlink-<date>.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T db psql -U devlink devlink
docker compose -f docker-compose.prod.yml start backend
```

> **Règle** : avant toute mise à jour la veille de la soumission, lancer `./deploy/backup.sh`.

---

## Limites connues, à assumer devant le jury

| Limite | Détail |
|---|---|
| Throttling par worker | Le cache est local à chaque worker Gunicorn : le quota de 5 par minute s'applique par worker, soit 15 avec trois workers. Un cache partagé le corrigerait, au prix d'un service de plus. |
| Pas de répartition de charge | Un seul serveur. Suffisant à cette échelle, mais c'est un point unique de défaillance. |
| Renouvellement TLS | Automatique via le timer de certbot, mais à vérifier une fois avant la soumission. |
| Sauvegardes locales | Elles vivent sur le même serveur. Les copier ailleurs (`scp`) au moins une fois avant la soumission. |

---

## Checklist avant la soumission (DL-48, DL-51)

- [ ] `https://<domaine>/api/v1/health/` répond depuis Internet
- [ ] Le parcours des 8 étapes fonctionne sur mobile et sur deux navigateurs
- [ ] Les 20 profils de démonstration sont visibles et étiquetés
- [ ] HTTPS valide, redirection depuis HTTP active
- [ ] VPS payé jusqu'au 2 novembre au minimum
- [ ] Justificatif d'achat Datacloud conservé
- [ ] Une sauvegarde a été faite **et restaurée** avec succès
- [ ] La surveillance tourne sur une autre machine
- [ ] Procédure de retour arrière relue
- [ ] `deploy/.env` n'est pas dans Git (`git status` doit l'ignorer)
