# Décisions techniques

Une entrée par choix important, avec sa raison. Lecture utile avant l'oral devant le jury.

## 2026-10-06 — PostgreSQL via pg8000 plutôt que SQLite

**Décision.** La base de données est PostgreSQL 17, accédée par le pilote `pg8000`
avec le backend Django `django-pg8000`. SQLite reste utilisable en local avec
`DB_ENGINE=sqlite` (lancement sans Docker, et tests rapides en mémoire).

**Pourquoi.** Le règlement du concours (art. 6) interdit les licences à réciprocité.
Les pilotes PostgreSQL habituels de Django, `psycopg` et `psycopg2`, sont sous LGPL :
ils sont donc exclus. `pg8000` est un pilote PostgreSQL écrit en Python pur, sous
licence BSD-3-Clause, et `django-pg8000` est sous MIT-0. Les licences sont donc
conformes, et l'équipe garde un vrai SGBD (concurrence d'écriture, types `jsonb`,
contraintes, index) au lieu de SQLite.

**Dépendances ajoutées et leurs licences.**

| Paquet | Version | Licence |
|---|---|---|
| pg8000 | 1.31.5 | BSD-3-Clause |
| django-pg8000 | 0.0.5 | MIT-0 |
| scramp | 1.4.17 | MIT-0 |
| asn1crypto | 1.5.1 | MIT |
| python-dateutil | 2.9.0 | Apache-2.0 / BSD |
| pytz | 2026.5 | MIT |
| six | 1.17.0 | MIT |

Le serveur PostgreSQL lui-même est sous licence PostgreSQL (permissive) ; il tourne
dans Docker et n'est pas distribué avec notre code.

**Le coût de ce choix.** `django-pg8000` est jeune (version 0.0.5) et peu utilisé.
Deux défauts ont été corrigés dans `backend/config/db/base.py` :

1. Il déclarait `supports_json_field = False`, ce qui faisait rejeter par Django
   tous nos `JSONField` (erreur de contrôle `fields.E180`).
2. Son `vendor` valait `postgresql_pg8000`, donc Django ne trouvait pas les
   variantes `as_postgresql()` des recherches sur clés JSON, et ces requêtes
   échouaient avec une erreur de syntaxe SQL.

Ces deux correctifs sont couverts par `backend/tests/test_json_fields.py`
(écriture et relecture, `contains`, accès par index, filtre par clé).

**Le risque à surveiller.** Un défaut de ce backend peut encore apparaître sur des
requêtes plus complexes (agrégations, sous-requêtes). La parade est prête : les
modèles n'utilisent aucun champ propre à PostgreSQL (pas d'`ArrayField`, pas de
`SearchVector`), donc un retour à SQLite reste possible avec `DB_ENGINE=sqlite`.
Pour cette raison, les tests tournent sur les deux bases en CI.

**Note sur le cahier des charges.** Sa section 3 demandait « SQLite en mode WAL (le
pilote PostgreSQL est exclu) ». L'exclusion visait `psycopg` ; `pg8000` lève
l'obstacle juridique. L'équipe a choisi PostgreSQL le 2026-10-06.
