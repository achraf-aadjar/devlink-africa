"""Django settings for DevLink Africa.

All configuration comes from the environment (os.environ). For local
development, a `backend/.env` file (KEY=value lines) is read first; real
environment variables always take precedence.
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv(path):
    """Minimal .env reader (no extra dependency)."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


_load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


DEBUG = env_bool("DEBUG", False)

# No default SECRET_KEY in production. A throwaway key is only tolerated in DEBUG.
SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "insecure-dev-only-key-do-not-use-in-production"  # noqa: S105
    else:
        raise RuntimeError("SECRET_KEY must be set in the environment when DEBUG is False.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1" if DEBUG else "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "rest_framework_simplejwt.token_blacklist",
    # Local
    "accounts",
    "profiles",
    "skills",
    "projects",
    "exchanges",
    "matching",
    "search",
    "ai",
    "reports",
    "core",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database ---------------------------------------------------------------
# PostgreSQL through pg8000 (BSD-3) and django-pg8000 (MIT-0): psycopg is LGPL
# and forbidden by the contest rules. SQLite stays available (DB_ENGINE=sqlite)
# for a zero-setup local run.
DB_ENGINE = os.environ.get("DB_ENGINE", "postgresql").lower()

if DB_ENGINE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.environ.get("DATABASE_PATH", str(BASE_DIR / "db.sqlite3")),
            "OPTIONS": {
                "transaction_mode": "IMMEDIATE",
                "timeout": 5,  # seconds: sqlite busy timeout
                "init_command": (
                    "PRAGMA journal_mode=WAL;PRAGMA synchronous=NORMAL;PRAGMA busy_timeout=5000;"
                ),
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "config.db",
            "NAME": os.environ.get("DB_NAME", "devlink"),
            "USER": os.environ.get("DB_USER", "devlink"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "5432"),
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", 60)),
        }
    }

# --- Auth -------------------------------------------------------------------
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- i18n -------------------------------------------------------------------
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static files -----------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- CORS -------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
# Jamais d'origine générique : seules les origines listées sont acceptées.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_HEADERS = ("accept", "authorization", "content-type", "origin", "x-requested-with")
CORS_ALLOW_METHODS = ("DELETE", "GET", "OPTIONS", "PATCH", "POST")

# --- Django REST framework --------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.BearerJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "300/minute",
        # Scope for login / registration views: use ScopedRateThrottle with
        # throttle_scope = "auth".
        "auth": "5/minute",
        # Signalements : plafond journalier pour éviter le détournement (DL-32).
        "reports": "10/day",
        # Fonctions d'IA : limite par utilisateur, en plus du plafond global.
        "ai": "20/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # La déconnexion met le jeton de rafraîchissement en liste noire (DL-03).
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "DevLink Africa API",
    "DESCRIPTION": "API de la plateforme d'échange de compétences DevLink Africa.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Plusieurs modèles ont un champ « status » ou « kind » : on nomme chaque
    # énumération, sinon drf-spectacular invente des noms illisibles.
    "ENUM_NAME_OVERRIDES": {
        "ProjectStatusEnum": "projects.models.Project.Status",
        "JoinRequestStatusEnum": "projects.models.ProjectJoinRequest.Status",
        "ExchangeStatusEnum": "exchanges.models.Exchange.Status",
        "ExchangeTypeEnum": "exchanges.models.Exchange.Type",
        "ReportStatusEnum": "reports.models.Report.Status",
        "ReportReasonEnum": "reports.models.Report.Reason",
        "ReportTargetTypeEnum": "reports.models.Report.TargetType",
        "SkillKindEnum": "skills.models.UserSkill.Kind",
        "SkillLevelEnum": "skills.models.UserSkill.Level",
        "SkillCategoryEnum": "skills.models.Skill.Category",
        "SkillProofKindEnum": "skills.models.SkillProof.Kind",
    },
}

API_VERSION = SPECTACULAR_SETTINGS["VERSION"]

# --- Fonctions d'IA (DL-41, DL-43) -----------------------------------------
# Désactivées par défaut : le produit doit fonctionner entièrement sans elles.
# La clé vit dans l'environnement, jamais dans le dépôt.
AI_ENABLED = env_bool("AI_ENABLED", False)
AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_BASE_URL = os.environ.get("AI_BASE_URL", "https://api.anthropic.com")
AI_MODEL = os.environ.get("AI_MODEL", "claude-haiku-4-5-20251001")
AI_TIMEOUT = float(os.environ.get("AI_TIMEOUT", 12))
# Plafond journalier (DL-41) : un dépassement renvoie au chemin classique,
# jamais une erreur pour l'utilisateur.
AI_DAILY_LIMIT = int(os.environ.get("AI_DAILY_LIMIT", 200))

# --- Connexion avec Google ---------------------------------------------------
# Vide par défaut : « Continuer avec Google » reste masqué côté interface tant
# qu'aucun identifiant client n'est fourni. L'identifiant client OAuth n'est
# pas un secret (il est aussi envoyé au navigateur), mais il doit être obtenu
# depuis Google Cloud Console — voir docs/DECISIONS.md pour la marche à suivre.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

# --- Journalisation ---------------------------------------------------------
# Format simple et lisible. Règle 6 du cahier : ni mot de passe, ni jeton, ni
# adresse e-mail en clair. Le journal d'audit remplace l'adresse par une
# empreinte (voir accounts/services.py).
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "{asctime} {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "standard"},
    },
    "root": {"handlers": ["console"], "level": os.environ.get("LOG_LEVEL", "INFO")},
    "loggers": {
        # Audit des actions sensibles : connexion échouée, suppression de
        # compte, signalement. Toujours conservé, même en production.
        "accounts.audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
        # Journal des appels d'IA (DL-43) : volumétrie et échecs, sans contenu.
        "ai.calls": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.db.backends": {"level": "WARNING"},
    },
}

# Taille maximale d'une requête : une charge JSON démesurée est refusée avant
# d'être analysée (DL-29).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("DATA_UPLOAD_MAX_MEMORY_SIZE", 2_621_440))  # 2,5 Mo
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE

# --- Production hardening ---------------------------------------------------
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SAMESITE = "Lax"
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", 31536000))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # Préchargement HSTS : à activer seulement quand le domaine est définitif,
    # car l'inscription sur la liste des navigateurs est difficile à défaire.
    SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", True)
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
    X_FRAME_OPTIONS = "DENY"
    # nginx termine le TLS et transmet X-Forwarded-Proto.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
