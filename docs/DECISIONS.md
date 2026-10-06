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

---

## 2026-10-07 — Trois niveaux de compétence, pas quatre

**Décision.** `UserSkill.level` vaut `BEGINNER`, `INTERMEDIATE` ou `ADVANCED`. Le niveau `EXPERT`, présent dans le premier modèle, est retiré.

**Pourquoi.** Le ticket DL-15 énonce « Niveau BEGINNER/INTERMEDIATE/ADVANCED ». Les tickets font foi pour le périmètre. Quatre niveaux obligeraient en plus l'interface à distinguer « avancé » d'« expert », ce qu'aucune maquette ne demande.

**Coût.** Nul : la migration a été appliquée avant toute donnée réelle.

---

## 2026-10-07 — Une sous-classe de JWTAuthentication pour obtenir des 401

**Décision.** Toutes les vues utilisent `core.authentication.BearerJWTAuthentication` plutôt que `JWTAuthentication` directement.

**Pourquoi.** DRF choisit entre `401` et `403` selon qu'une classe d'authentification sait produire un en-tête `WWW-Authenticate`. Sur une vue publique déclarée avec `authentication_classes = []`, une authentification refusée renvoyait `403`, alors que le contrat d'API annonce `401`. La sous-classe fournit cet en-tête.

Elle est aussi déclarée auprès de drf-spectacular (`core/schema.py`), sinon le schéma OpenAPI est généré avec un avertissement et sans le schéma de sécurité Bearer.

---

## 2026-10-07 — Les champs inconnus sont refusés, non ignorés

**Décision.** `StrictSerializer` (dans `accounts/serializers.py`) rejette en `400` tout champ non déclaré.

**Pourquoi.** Par défaut, DRF ignore silencieusement les champs inconnus. Un client pourrait donc envoyer `{"is_staff": true}` à l'inscription sans erreur. Même si le service n'utilise pas ce champ, un refus explicite vaut mieux qu'un silence : la faute est signalée au développeur, et l'API documente sa propre surface. Couvert par `test_register_rejects_unknown_fields`.

---

## 2026-10-07 — Aucune bibliothèque d'icônes ni de composants

**Décision.** Design system fait par nous : neuf composants dans `frontend/src/components/ui/`, icônes en SVG inline, polices système.

**Pourquoi.** Trois raisons. D'abord la règle des licences : chaque dépendance ajoutée est un risque à vérifier, et une police ou un jeu d'icônes mal licencié rendrait le projet irrecevable. Ensuite la note : le cahier demande un design « sobre et distinctif, pas un modèle générique ». Enfin le poids : le build reste léger, ce qui compte pour des connexions africaines parfois lentes.

`lucide-react` était autorisé par le cahier ; nous ne l'avons pas ajouté, faute de besoin réel.

---

## 2026-10-07 — Renouvellement du jeton dans le client d'API

**Décision.** `lib/api.ts` intercepte un `401`, tente **une seule fois** de renouveler le jeton d'accès, puis rejoue la requête.

**Pourquoi.** Le jeton d'accès dure 30 minutes (choix de sécurité). Sans ce mécanisme, l'utilisateur serait déconnecté toutes les 30 minutes en pleine navigation. La tentative unique évite toute boucle infinie si le jeton de rafraîchissement est lui aussi révoqué ; dans ce cas, la session est effacée et la garde de routes renvoie vers la connexion.

---

## 2026-10-07 — TanStack Query n'est pas ajouté

**Décision.** Les appels passent par `lib/api.ts` et `useState`/`useEffect`, sans bibliothèque de gestion de requêtes.

**Pourquoi.** Le cahier l'autorisait, licence permise. Mais à l'échelle du projet (une quinzaine d'écrans, pas de synchronisation complexe), elle ajouterait une dépendance et un concept de plus à expliquer au jury, qui évalue la maîtrise du code par l'équipe. Si la mise en cache devient un vrai besoin en Phase 2, la décision sera revue ici.

---

## 2026-10-07 — eslint-plugin-jsx-a11y retiré : il tire axe-core (MPL-2.0)

**Décision.** Le plugin `eslint-plugin-jsx-a11y` est retiré. Six règles d'accessibilité maison le remplacent, dans `frontend/eslint-rules/a11y.js`.

**Pourquoi.** Le cahier des charges contient une contradiction : sa section 3 impose `eslint-plugin-jsx-a11y`, alors que sa règle 1 interdit nommément `axe-core` (MPL-2.0). Or le plugin dépend de `axe-core` :

```
eslint-plugin-jsx-a11y@6.10.2
`-- axe-core@4.14.0   (MPL-2.0)
```

Le contrôle des licences a échoué dès l'installation. La règle des licences l'emporte : une licence à réciprocité peut rendre le projet irrecevable, alors qu'un plugin de lint est remplaçable. Une seule règle du plugin (`autocomplete-valid`) utilise réellement `axe-core`, mais le paquet se retrouve malgré tout dans `node_modules` et dans `package-lock.json`, donc le risque subsiste.

**Ce que couvrent nos règles.** Les fautes que nous risquons réellement dans ce projet :

| Règle | Ce qu'elle empêche |
|---|---|
| `img-requires-alt` | Une image sans texte alternatif |
| `anchor-requires-href` | Un `<a>` sans destination, non focusable |
| `target-blank-requires-noopener` | Un lien `_blank` sans `rel="noopener"` (critère de DL-35) |
| `button-requires-type` | Un bouton qui soumet un formulaire par inadvertance |
| `control-requires-label` | Un champ sans nom accessible |
| `clickable-needs-keyboard` | Un `onClick` sur un `<div>`, inutilisable au clavier |

Chaque règle a été vérifiée sur un fichier d'essai contenant les six fautes : toutes sont signalées.

**Ce que nous perdons.** Les règles plus fines du plugin (vérification des attributs ARIA, rôles valides, etc.). Pour compenser, DL-34 prévoit une vérification manuelle de l'accessibilité : navigation entière au clavier et contrastes.

**À signaler à l'équipe** : si l'organisateur répond à DL-10 que la MPL-2.0 est acceptée, cette décision pourra être revue.
