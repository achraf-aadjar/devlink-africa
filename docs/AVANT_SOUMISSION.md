# Avant la soumission : ce qui reste à faire à la main

Le code, les tests et la documentation sont prêts. Restent des actions qu'aucun outil ne peut faire à votre place : payer, envoyer, signer, voter, répéter. Classées par échéance.

Soumission : **au plus tard le 24 octobre** (clôture le 25 à 17 h GMT). Vote : **du 25 octobre 18 h au 26 octobre 23 h 59 GMT**.

---

## Tout de suite

| Qui | Quoi | Comment | Fait |
|---|---|---|---|
| Omar | **DL-10** · Écrire à l'organisateur (cadev@systalink.com). Échéance dépassée depuis le 6 octobre. | Poser les questions ouvertes de `docs/PROGRESS.md`, notamment sur la MPL-2.0. Garder la réponse : elle conditionne l'audit des licences (DL-59). | ☐ |
| Achraf | **DL-05** · Commander le VPS Datacloud **à Dakar** (le code promotionnel n'est valable que là) et mettre le site en ligne. | Suivre `deploy/README.md`, étapes 1 à 11. Les migrations, dont celle du moyen de contact, s'appliquent seules au démarrage. | ☐ |
| Achraf | Garder le **justificatif d'achat** Datacloud. | Condition de recevabilité (art. 6). Le ranger hors du dépôt. | ☐ |
| Achraf | **DL-01** · Protéger la branche principale sur GitHub. | Réglages du dépôt → Branches : PR obligatoire, 1 relecture, CI verte (jobs `backend`, `frontend`, `e2e`, `licenses`, `secrets`). | ☐ |
| Les 3 | **DL-04** · Valider le contrat d'API. | Relire `docs/api.md`, y compris le tableau « Modifications après le gel », puis cocher les trois cases de l'en-tête. | ☐ |

## Avant le 19 octobre

| Qui | Quoi | Comment | Fait |
|---|---|---|---|
| Achraf | **DL-30** · Sauvegardes et surveillance. | `deploy/README.md`, sections « Sauvegardes » et « Surveillance ». **Tester une restauration** au moins une fois : c'est le critère d'acceptation. | ☐ |
| Omar | Relire ligne à ligne `backend/matching/scoring.py`, `matching/services.py`, `exchanges/serializers.py` et `core/validators.py`. | Cocher la ligne correspondante dans `AI_USAGE.md` (« Relu par »). | ☐ |
| Emmanuel | Relire `MatchExplanation.tsx`, la refonte visuelle, `ContactPanel.tsx` et `OnboardingChecklist.tsx`. | Idem dans `AI_USAGE.md`. | ☐ |

## Avant le 23 octobre

| Qui | Quoi | Comment | Fait |
|---|---|---|---|
| Achraf | **DL-48** · Figer la version de production. | Tag Git sur le commit déployé ; vérifier la « Checklist avant la soumission » de `deploy/README.md`. | ☐ |
| Les 3 | **DL-52, DL-57, DL-61** · Répéter la démonstration, deux fois au minimum. | `docs/demo.md`, 4 minutes. Lancer `make e2e` juste avant : s'il passe, le parcours fonctionne. Chacun répond aux questions de sa partie avec `docs/EXPLICATION_JURY.md`, sans notes. | ☐ |
| Les 3 | **DL-53, DL-58, DL-62** · Déclarations de titularité. | Une par membre. | ☐ |

## Le 24 octobre

| Qui | Quoi | Comment | Fait |
|---|---|---|---|
| Achraf | **DL-51** · Soumettre sur Datacloud. | URL publique, dépôt, `AI_USAGE.md` et `LICENSES.md` à jour. Vérifier `https://<domaine>/api/v1/health/` juste avant. | ☐ |

## Du 25 octobre 18 h au 26 octobre 23 h 59 GMT

| Qui | Quoi | Fait |
|---|---|---|
| Achraf | **DL-63** · Voter | ☐ |
| Emmanuel | **DL-64** · Voter | ☐ |
| Omar | **DL-65** · Voter | ☐ |

**Un seul oubli exclut toute l'équipe.** Mettre un rappel dans le téléphone de chacun dès aujourd'hui.
