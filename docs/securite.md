# Sécurité : ce qui est protégé, comment, et comment le vérifier

État : Phase 1. Le durcissement complet est le ticket DL-29.

## 1. Mots de passe

| Mesure | Où | Vérification |
|---|---|---|
| Hachage Argon2 | `PASSWORD_HASHERS`, `config/settings.py` | `test_user_is_identified_by_email` vérifie le préfixe `argon2` |
| 10 caractères minimum | `RegisterSerializer`, `accounts/serializers.py` | `test_register_rejects_a_password_shorter_than_10_characters` |
| Validateurs Django (similarité avec l'e-mail, mot de passe courant, tout numérique) | `AUTH_PASSWORD_VALIDATORS` | `test_register_rejects_a_password_too_close_to_the_email` |

## 2. Jetons

- Accès valable 30 minutes, rafraîchissement 7 jours.
- **Rotation** : chaque rafraîchissement émet un nouveau jeton et révoque l'ancien (`ROTATE_REFRESH_TOKENS`, `BLACKLIST_AFTER_ROTATION`).
- **Déconnexion** : le jeton de rafraîchissement passe en liste noire ; sa réutilisation renvoie `401`.
- Vérification : `test_logout_blacklists_the_refresh_token`, `test_refresh_rotates_and_revokes_the_previous_token`.

## 3. Limitation de débit

| Portée | Limite | Où |
|---|---|---|
| `/auth/*` | 5 par minute et par IP | `core/throttling.py` (`AuthRateThrottle`) |
| Anonyme | 60 par minute | `DEFAULT_THROTTLE_RATES` |
| Connecté | 300 par minute | `DEFAULT_THROTTLE_RATES` |

Vérification : `test_login_is_throttled_after_five_attempts_per_minute`, `test_register_is_throttled_after_five_attempts_per_minute`.

> Limite connue : le cache est local à chaque worker Gunicorn, donc le quota est appliqué par worker. C'est accepté pour la taille du projet, et noté dans `deploy/README.md`.

## 4. Énumération des comptes

Une connexion échouée renvoie **le même corps et le même statut** que l'adresse soit inconnue, le mot de passe faux ou le compte désactivé. Vérification : `test_login_of_an_unknown_email_gives_the_same_answer_as_a_wrong_password`.

Même principe pour les ressources d'autrui : l'API renvoie `404` et non `403`, afin de ne pas confirmer qu'une ressource existe.

## 5. Validation des entrées

- **Les champs non déclarés sont refusés** (`StrictSerializer`), ils ne sont pas ignorés en silence. C'est ce qui empêche une élévation de privilèges du type `{"is_staff": true}` à l'inscription. Vérification : `test_register_rejects_unknown_fields`.
- Longueurs maximales sur tous les champs texte.
- Énumérations en liste blanche (voir `docs/api.md` § 19).
- URLs fournies par l'utilisateur : `https` obligatoire.

## 6. Journalisation

Règle : **jamais** de mot de passe, de jeton ni d'adresse e-mail en clair dans les journaux.

Le journal d'audit (`accounts.audit`) consigne les événements sensibles. L'adresse y est remplacée par une empreinte SHA-256 tronquée (`email_fingerprint`), ce qui permet de corréler des tentatives sans stocker de donnée personnelle.

Vérification : `test_logs_never_contain_the_password_the_tokens_or_the_email`, `test_a_failed_login_is_audited_without_the_email`.

## 7. Base de données

- **ORM uniquement**, aucun SQL construit par concaténation.
- Contraintes d'unicité et `CheckConstraint` **en base**, pas seulement dans le code.
- Transactions atomiques pour les écritures multiples (`register_user`).

## 8. Production (`DEBUG=False`)

| Mesure | Réglage |
|---|---|
| Aucune clé par défaut | `RuntimeError` au démarrage si `SECRET_KEY` est absente |
| Cookies sécurisés | `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` |
| HSTS | `SECURE_HSTS_SECONDS` (1 an), `INCLUDE_SUBDOMAINS` |
| Redirection SSL | `SECURE_SSL_REDIRECT`, paramétrable |
| `ALLOWED_HOSTS` explicite | aucune valeur par défaut hors `DEBUG` |
| En-têtes | `SECURE_CONTENT_TYPE_NOSNIFF`, `X-Frame-Options`, plus nginx |

Vérification : `SECRET_KEY=… DEBUG=False python manage.py check --deploy`.

## 9. Secrets

Uniquement par variables d'environnement. `.env` et `deploy/.env` sont exclus par `.gitignore`. Aucun secret dans le dépôt ni dans l'historique.

## 10. Frontend

- Jamais de `dangerouslySetInnerHTML`.
- `no-console` est une **erreur** ESLint : un jeton ne peut pas finir dans la console par inadvertance.
- Les jetons sont dans `localStorage`, isolés dans `lib/token.ts`, et tous les accès sont protégés par `try/catch`.

## Reste à faire (DL-29)

CORS strict en production, limite de taille des requêtes, CSP dans `deploy/nginx.conf`, tests d'injection et de XSS, scan de secrets dans la CI, revue OWASP.
