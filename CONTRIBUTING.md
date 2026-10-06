# Contribuer à DevLink Africa

## Branches

- `main` est protégée : **jamais de push direct**.
- Une branche par ticket : `feat/<sujet>`, `fix/<sujet>`, `chore/<sujet>`, `docs/<sujet>`.

## Pull requests

1. Ouvrez la PR vers `main` en remplissant la checklist du modèle.
2. **Une relecture** d'un autre membre de l'équipe est obligatoire avant fusion.
3. La CI (tests backend, lint + build frontend, licences) doit être verte.

## Commits

Petits, ciblés, en français, à l'impératif ou au présent, préfixés (`feat:`, `fix:`, `chore:`, `docs:`, `test:`) :
`feat(profiles): ajoute la modification du profil`.

## Règle des licences

Avant d'ajouter une dépendance (directe ou transitive), vérifiez sa licence : **permissive uniquement** (MIT, Apache-2.0, BSD, ISC, PSF…). GPL, AGPL, LGPL, MPL ou licence inconnue : **n'ajoutez pas**, signalez-le à l'équipe.

- Versions exactes dans `package.json` (sans `^` ni `~`) et `requirements.txt` (`==`).
- Lancez `make licenses` ; mettez à jour `LICENSES.md`.
- Une exception ne se fait que dans `licenses-allowlist.txt`, avec justification, validée en revue.

## Règle IA

Tout usage d'un outil d'IA (code, texte, tests…) est consigné dans `AI_USAGE.md` (date, outil, partie concernée). Vous restez responsable de comprendre et de relire ce qui est produit.

## Qualité

- Code et identifiants en **anglais** ; interface et documentation en **français**.
- Avant de pousser : `make lint test licenses`.
- Aucun secret dans le dépôt (`.env` n'est jamais commité).
