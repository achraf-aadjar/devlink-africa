# Licences des dépendances

Règle du concours (art. 6) : licences permissives uniquement. Généré le 2026-10-06 ; contrôle : `make licenses`.

## Python (backend/requirements.txt, y compris dépendances transitives)

| Paquet | Version | Licence |
|---|---|---|
| argon2-cffi | 25.1.0 | MIT |
| argon2-cffi-bindings | 26.1.0 | MIT |
| asgiref | 3.12.1 | BSD License |
| asn1crypto | 1.5.1 | MIT License |
| attrs | 26.1.0 | MIT |
| cffi | 2.1.1 | MIT-0 |
| coverage | 7.16.2 | Apache-2.0 |
| Django | 5.2.17 | BSD-3-Clause |
| django-cors-headers | 4.9.0 | MIT |
| django-filter | 26.2 | BSD License |
| django_pg8000 | 0.0.5 | MIT No Attribution License (MIT-0) |
| djangorestframework | 3.18.1 | BSD-3-Clause |
| djangorestframework_simplejwt | 5.5.1 | MIT License |
| drf-spectacular | 0.30.0 | BSD-3-Clause |
| gunicorn | 26.2.0 | MIT |
| inflection | 0.5.1 | MIT License |
| iniconfig | 2.3.0 | MIT |
| jsonschema | 4.26.0 | MIT |
| jsonschema-specifications | 2025.9.1 | MIT |
| packaging | 26.3 | Apache-2.0 OR BSD-2-Clause |
| pg8000 | 1.31.5 | BSD License |
| pluggy | 1.6.0 | MIT License |
| pycparser | 3.0 | BSD-3-Clause |
| Pygments | 2.21.0 | BSD-2-Clause |
| PyJWT | 2.15.1 | MIT |
| pytest | 9.1.1 | MIT |
| pytest-django | 4.14.0 | BSD License |
| python-dateutil | 2.9.0.post0 | Apache Software License; BSD License |
| pytz | 2026.5 | MIT License |
| PyYAML | 6.0.3 | MIT License |
| referencing | 0.37.0 | MIT |
| rpds-py | 2026.9.1 | MIT |
| ruff | 0.16.10 | MIT |
| scramp | 1.4.17 | MIT No Attribution License (MIT-0) |
| six | 1.17.0 | MIT License |
| sqlparse | 0.6.0 | BSD License |
| uritemplate | 4.2.0 | BSD 3-Clause OR Apache-2.0 |
| whitenoise | 6.12.0 | MIT |

## Node (frontend/package.json, dépendances directes)

| Paquet | Version | Licence |
|---|---|---|
| @eslint/js | 9.39.5 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @vitejs/plugin-react | 4.7.0 | MIT |
| autoprefixer | 10.6.1 | MIT |
| eslint | 9.39.5 | MIT |
| eslint-plugin-react-hooks | 7.1.1 | MIT |
| eslint-plugin-react-refresh | 0.5.7 | MIT |
| globals | 17.13.0 | MIT |
| postcss | 8.5.29 | MIT |
| prettier | 3.9.9 | MIT |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| react-router-dom | 7.18.4 | MIT |
| tailwindcss | 3.4.19 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| typescript-eslint | 8.71.1 | MIT |
| vite | 6.4.4 | MIT |
| vitest | 3.2.7 | MIT |

Les 329 paquets Node transitifs sont contrôlés par `scripts/check_licenses.sh node`.

## Exceptions justifiées (`licenses-allowlist.txt`)

- **caniuse-lite** (CC-BY-4.0) : données de compatibilité des navigateurs, utilisées à la compilation seulement (Browserslist/autoprefixer), non incluses dans le livrable exécuté.

## PostgreSQL

Le pilote est **pg8000** (BSD-3-Clause) avec le backend Django **django-pg8000** (MIT-0), plus les dépendances scramp (MIT-0), asn1crypto (MIT), python-dateutil (Apache-2.0/BSD), pytz (MIT), six (MIT). Le serveur PostgreSQL (licence PostgreSQL) tourne dans Docker et n'est pas distribué avec le code.

## Interdits

 psycopg / psycopg2 (LGPL), mysqlclient (GPL), vite ≥ 7 et tailwindcss ≥ 4 (lightningcss, MPL-2.0), Next.js, sharp. Aucun n'est installé.
