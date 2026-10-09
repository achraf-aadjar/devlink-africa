# Expliquer DevLink Africa au jury

Document de préparation orale. Pour chaque module : ce qu'il fait, comment, pourquoi ce choix. Les questions probables du jury figurent à la fin de chaque section, avec des éléments de réponse.

**Règle de l'équipe** : chacun doit pouvoir expliquer sa partie sans lire ses notes, y compris le code produit avec l'aide de l'IA (voir `AI_USAGE.md`).

---

## 1. Le produit en une phrase

DevLink Africa met en relation des développeurs africains selon leurs compétences **complémentaires** : ce que l'un sait faire répond à ce que l'autre veut apprendre, et réciproquement.

**La différence avec un réseau social professionnel** : nous ne proposons pas « des gens qui vous ressemblent », mais des gens avec qui l'échange a un sens dans les deux sens. Et nous expliquons toujours pourquoi.

---

## 2. Dev Match : le cœur du produit

### Ce qu'il fait

Il attribue à chaque paire de développeurs un score de 0 à 100, accompagné de sa décomposition.

### Comment

Six critères pondérés, dans `backend/matching/scoring.py` :

| Critère | Poids | Ce qu'il mesure |
|---|---|---|
| Complémentarité | 35 % | Ce que A sait et que B veut apprendre |
| Réciprocité | 20 % | L'échange va-t-il dans les deux sens ? |
| Envie de collaborer | 15 % | Disponibilités tournées vers le travail commun |
| Technologies communes | 10 % | Un socle technique partagé |
| Disponibilité | 10 % | Des créneaux sont déclarés |
| Domaine | 10 % | Même domaine d'activité |

### Pourquoi ces choix

- **Le module est une fonction pure** : il n'importe ni Django ni la base de données. Il se teste donc directement, sans serveur, ce qui explique les 59 tests qui le couvrent.
- **La réciprocité est en tout ou rien.** Si l'un n'a rien à apprendre à l'autre, ce critère tombe à zéro. Ce n'est pas un détail : c'est ce qui distingue un échange d'un service à sens unique.
- **Un match à sens unique est plafonné à 55.** Nous avons vérifié par balayage exhaustif qu'aucune combinaison ne dépasse ce plafond, alors qu'un vrai échange démarre au-dessus de 90. L'écart est donc franc.

### Exemple chiffré

Ada sait TypeScript et Docker, veut apprendre Python. Kofi sait Python et Docker, veut apprendre TypeScript. Tous deux disponibles pour du mentorat, tous deux en WEB.

| Critère | Points |
|---|---|
| Complémentarité | 31,5 / 35 |
| Réciprocité | 20 / 20 |
| Envie de collaborer | 11 / 15 |
| Technologies communes | 10 / 10 |
| Disponibilité | 5 / 10 |
| Domaine | 5 / 10 |
| **Total** | **82,5 / 100** |

### Questions probables

> **« Pourquoi 35 % pour la complémentarité ? »**
> C'est la raison d'être du produit : sans compétences complémentaires, il n'y a rien à échanger. Les autres critères affinent, mais celui-là décide. Les poids sont dans une constante unique, documentée, donc ajustables en un seul endroit après les premiers retours utilisateurs.

> **« Comment savez-vous que le score est juste ? »**
> Nous ne prétendons pas qu'il est « juste » dans l'absolu : c'est un choix de produit, pas une vérité. Ce que nous garantissons, c'est qu'il est **vérifiable** : la somme des points affichés est exactement égale au score, et un test le vérifie sur toutes les combinaisons. L'utilisateur peut refaire le calcul lui-même. Nous avons aussi ajouté un retour « utile / pas utile » sur chaque match (DL-39), stocké pour analyse, qui n'influence pas le score.

> **« Et si quelqu'un déclare savoir ce qu'il ne sait pas ? »**
> C'est la limite de tout système déclaratif. Nous l'atténuons avec les preuves de compétence (DL-31) : un lien vers un dépôt, une certification, une contribution. Le profil public affiche le nombre de preuves par compétence.

> **« Le score est-il recalculé à chaque affichage ? »**
> Non, ce serait coûteux. Il est recalculé à l'inscription et à chaque changement de compétences, et seulement pour les paires concernées par la personne modifiée. Le service tient en 7 requêtes SQL, quel que soit le nombre d'utilisateurs : un test vérifie que ce nombre ne croît pas avec la base.

---

## 3. Architecture backend

### Ce qu'elle fait

Elle sépare strictement la validation, la logique métier et les lectures.

### Comment

```
urls.py → views.py (vue mince) → serializers.py (validation)
                               → services.py (écritures, règles)
                               → selectors.py (lectures optimisées)
                               → models.py (contraintes en base)
```

### Pourquoi

- **Une vue ne contient jamais de règle métier.** Elle valide, appelle une fonction, renvoie. Conséquence pratique : pour expliquer une règle, on montre **une** fonction, pas un enchevêtrement.
- **Les contraintes sont en base, pas seulement dans le code.** Unicité d'une compétence par type, d'une demande en attente par paire, d'un retour par match. Un bug applicatif ne peut donc pas corrompre les données.

### Questions probables

> **« Pourquoi ne pas utiliser les ViewSets de DRF ? »**
> Ils cachent le comportement dans de l'héritage. Avec une quinzaine d'écrans et trois développeurs qui doivent défendre le code, la lisibilité compte plus que la concision. Chaque route est explicite.

> **« Qu'est-ce que `pair_key` dans le modèle Exchange ? »**
> Le ticket demande « une seule demande en attente par paire d'utilisateurs ». Une contrainte sur `(requester, partner)` ne couvrirait qu'un sens : Ada vers Kofi et Kofi vers Ada passeraient toutes deux. `pair_key` normalise la paire (« 3-7 » dans les deux cas), et la contrainte d'unicité porte sur elle. La règle tient donc même avec deux requêtes simultanées.

> **« Pourquoi renvoyer 404 et non 403 sur la ressource d'un autre ? »**
> Un 403 confirmerait que la ressource existe. En parcourant les identifiants, on pourrait cartographier les données des autres. Le queryset est filtré sur le propriétaire, donc l'objet est simplement introuvable.

---

## 4. Base de données : PostgreSQL sans psycopg

### Le problème

L'article 6 du règlement interdit les licences à réciprocité. Or les deux pilotes PostgreSQL habituels de Django, `psycopg` et `psycopg2`, sont sous **LGPL**. Les utiliser rendrait le projet irrecevable.

### Notre solution

`pg8000`, un pilote PostgreSQL écrit en Python pur, sous **BSD-3-Clause**, avec le backend Django `django-pg8000` (**MIT-0**).

### Le coût, et ce que nous avons fait

`django-pg8000` est jeune (version 0.0.5). Deux défauts ont dû être corrigés dans `backend/config/db/base.py` :

1. Il déclarait `supports_json_field = False`, ce qui faisait rejeter par Django tous nos `JSONField`.
2. Son `vendor` valait `postgresql_pg8000`, donc Django ne trouvait pas les variantes PostgreSQL des recherches sur clés JSON.

Les deux correctifs sont couverts par des tests dédiés.

### Questions probables

> **« Pourquoi ne pas être resté sur SQLite ? »**
> C'était notre premier choix, précisément pour éviter ce problème de licence. L'équipe a ensuite voulu un vrai SGBD, pour la concurrence d'écriture et les types `jsonb`. `pg8000` permet les deux sans enfreindre la règle.

> **« Et si pg8000 pose problème le jour de la démonstration ? »**
> Le repli est prêt et testé. Aucun modèle n'utilise de champ propre à PostgreSQL (pas d'`ArrayField`, pas de `SearchVector`), et la recherche textuelle utilise `icontains`. Un `DB_ENGINE=sqlite` suffit à basculer. Nos tests tournent sur les deux bases en intégration continue, ce qui garantit que ce repli fonctionne.

---

## 5. Sécurité

### Les points structurants

| Mesure | Détail |
|---|---|
| Mots de passe | Argon2, 10 caractères minimum, validateurs Django |
| Jetons | Accès 30 minutes, rafraîchissement avec rotation et liste noire à la déconnexion |
| Limitation de débit | 5 tentatives par minute sur `/auth/*`, 10 signalements par jour |
| Énumération des comptes | Mot de passe faux, adresse inconnue et compte désactivé donnent **la même réponse** |
| Champs inconnus | **Refusés**, pas ignorés : `{"is_staff": true}` à l'inscription renvoie 400 |
| Journaux | Jamais de mot de passe, de jeton ni d'adresse ; l'audit utilise une empreinte |
| Production | `check --deploy` sans aucun avertissement |

### Questions probables

> **« Pourquoi refuser les champs inconnus ? DRF les ignore par défaut. »**
> Justement. Un client pourrait croire avoir modifié `is_demo` ou `is_staff` sans jamais voir d'erreur. Le refus explicite documente la surface réelle de l'API et supprime une classe entière de malentendus.

> **« Avez-vous testé les injections ? »**
> Oui, huit tests d'injection SQL sur la recherche et les filtres. Nous avons aussi un test qui parcourt tout le code pour vérifier qu'aucun appel à `.raw()` ou `.extra()` n'existe : c'est l'ORM, et rien d'autre.

> **« Le throttling tient-il en production ? »**
> Partiellement, et nous le disons. Le cache est local à chaque worker Gunicorn, donc le quota de 5 par minute s'applique par worker, soit 15 avec trois workers. C'est accepté à cette échelle, et noté dans `deploy/README.md`. Un cache partagé (Redis) serait la solution, mais ajouterait une dépendance et un service à administrer.

---

## 6. Données personnelles

La loi sénégalaise n° 2008-12 est respectée par des fonctionnalités réelles, pas par une simple page :

- **Consentement explicite** à l'inscription, avec un lien vers la politique. Sans la case cochée, le compte n'est pas créé (vérifié par un test).
- **Droit d'accès** : export JSON complet depuis son profil.
- **Droit d'effacement** : suppression définitive, confirmée par le mot de passe.
- **Minimisation** : ni téléphone, ni adresse postale, ni traceur publicitaire. L'adresse e-mail n'apparaît **jamais** dans une réponse publique.
- **Contact révélé au bon moment** : chacun peut indiquer un moyen de contact (e-mail ou lien `https`). Il n'est visible que par la personne avec qui un échange a été **accepté**. Avant l'acceptation, ou après un refus, il reste caché (vérifié par des tests).

### Questions probables

> **« Une fois l'échange accepté, comment les deux personnes se parlent-elles ? »**
> L'acceptation débloque le moyen de contact que chacun a choisi de partager : une adresse e-mail ou un lien vers GitHub, LinkedIn… Le panneau « Échange accepté » l'affiche des deux côtés. Nous n'imposons pas notre messagerie : les développeurs ont déjà leurs outils, et une messagerie interne demanderait modération, notifications et stockage de conversations privées, donc beaucoup plus de données personnelles à protéger.

> **« Pourquoi refuser un texte libre comme "Telegram @ada" ? »**
> Parce que l'interface en fait un lien cliquable. N'accepter qu'un e-mail (`mailto:`) ou un lien `https:` écarte par construction les liens `javascript:` et tout contenu inattendu. La règle est appliquée côté serveur, et revérifiée côté interface avant de créer le lien.

> **« Pourquoi redemander le mot de passe pour supprimer un compte ? »**
> Parce qu'un jeton d'accès volé ne doit pas suffire à détruire un compte. C'est une action irréversible : elle mérite une confirmation forte.

---

## 7. Interface

### Les partis pris

- **L'explication du match est la vedette.** Score en évidence, puis « il peut vous apprendre / vous pouvez lui apprendre », puis les raisons en phrases, puis la répartition par critère sous forme de barres. Trois niveaux de lecture, du plus rapide au plus détaillé.
- **Quatre états sur chaque écran** : chargement (squelettes), vide (avec une action utile), erreur (avec réessai), succès. Un état vide ne dit jamais « aucun résultat » sans proposer quoi faire.
- **Aucune bibliothèque de composants ni d'icônes.** Neuf composants écrits par nous, icônes en SVG inline, polices système. Moins de dépendances à vérifier, un build léger, et un design qui ne ressemble pas à un modèle générique.
- **Un style classique et sobre.** Fond blanc, barre de navigation grise, panneaux à bordure fine, boutons à léger dégradé, polices système : l'esprit des sites bien faits des années 2010 (GitHub, Bootstrap 3). Aucun halo, aucun texte en dégradé, aucune animation décorative : rien ne détourne l'attention du contenu, et la page s'affiche vite sur une connexion lente.
- **Un nouveau compte n'est jamais laissé seul.** La liste « Vos premiers pas » dit quoi faire ensuite (profil, compétences, contact, premier échange), avec un seul bouton : la prochaine étape.
- **Testé sur mobile.** Les 18 écrans vérifiés à 390 px de large, sans aucun débordement horizontal.

### Questions probables

> **« Pourquoi pas de bibliothèque d'interface ? »**
> Trois raisons. La règle des licences : chaque dépendance est un risque à vérifier, et une police mal licenciée rendrait le projet irrecevable. La note : le cahier demande un design distinctif. Le poids : le JavaScript du build fait 118 ko compressés, ce qui compte pour des connexions africaines parfois lentes.

> **« Pourquoi un style aussi classique ? »**
> Parce qu'il a fait ses preuves : on sait tout de suite où cliquer, ce qui est un lien, ce qui est un bouton. Les effets à la mode (fonds sombres lumineux, textes en dégradé, cartes qui flottent) se ressemblent tous et vieillissent vite ; nous avons préféré la lisibilité. Les contrastes sont vérifiés (au moins 4,5:1 pour le texte).

> **« Et l'accessibilité ? »**
> Labels liés aux champs, erreurs annoncées par `aria-describedby`, focus toujours visible, lien d'évitement, barres du score décrites pour les lecteurs d'écran. Nous avons dû retirer `eslint-plugin-jsx-a11y`, qui dépend de `axe-core` (MPL-2.0) : nous l'avons remplacé par six règles ESLint écrites par nous, chacune vérifiée sur un cas de faute.

---

## 8. Qualité et conformité

| Indicateur | Valeur |
|---|---|
| Tests backend | 484, couverture 98 % (98 % sur matching et services) |
| Tests frontend | 185, couverture 92 % |
| Parcours de démonstration | Rejoué deux fois en CI : par l'API (pytest) et dans un vrai navigateur (Playwright, Chromium) |
| Licences | 0 licence à réciprocité, contrôlée en CI sur l'arbre complet |
| Secrets | Scan maison en CI, 0 trouvé |
| Schéma OpenAPI | 0 avertissement, 0 erreur |

### Questions probables

> **« Comment être sûrs que la démonstration ne cassera pas devant nous ? »**
> Le parcours est rejoué à chaque modification, deux fois : par l'API (`backend/tests/test_parcours_demo.py`) et dans Chromium (`e2e/tests/parcours-demo.spec.ts`), qui clique dans l'interface comme vous le verrez : inscription, profil, compétences, match en tête, demande d'échange, acceptation depuis un second navigateur, contact révélé, projet. Si l'un échoue, la CI est rouge.

> **« Comment avez-vous contrôlé les licences ? »**
> Un script maison (`scripts/check_licenses.sh`) analyse l'arbre complet des dépendances, Python et Node, et échoue si une licence GPL, AGPL, LGPL ou MPL apparaît. Il tourne en intégration continue sur chaque pull request. Il nous a réellement servi : il a détecté `axe-core` (MPL-2.0) arrivé en dépendance indirecte, ce que nous n'aurions pas vu à l'œil nu.

---

## 9. Ce qui nous distingue

Tous les candidats partent du même sujet. Quatre ajouts répondent chacun à une limite concrète de la mise en relation à deux. Détail des choix : `docs/DECISIONS.md`, 2026-10-09.

### Cercles d'échange

L'échange à deux exige une double coïncidence : je veux ce que tu sais, et tu veux ce que je sais. Aminata (Dakar) veut FastAPI et enseigne React ; Kwame (Accra) enseigne FastAPI mais veut Docker ; Imani (Nairobi) enseigne Docker et veut React. Aucune paire ne marche, le trio si : chacun apprend au suivant. DevLink cherche ces **cycles** de 3 ou 4 personnes dans le graphe « qui peut apprendre quoi à qui » (`backend/circles/finder.py`, module pur, 24 tests). Les contacts ne se révèlent que lorsque les trois ont accepté.

### Observatoire des compétences

Une page publique qui additionne l'offre et la demande : les compétences qui manquent, celles qu'on peut partager, et les **ponts** entre pays (« FastAPI : recherché au Sénégal, proposé au Ghana »). Que des comptes, aucun nom.

### Compétences validées par les pairs

Déclarer « Node.js, avancé » ne coûte rien. Après un échange terminé, ou dans un cercle actif, on peut valider la compétence que l'autre nous a transmise. La validation est nominative et publique sur son profil : celui qui la donne s'engage. Le serveur vérifie qu'on a réellement travaillé ensemble.

### Interface en anglais

« Développeurs africains » inclut le Ghana, le Nigeria, le Kenya : une plateforme seulement francophone couperait le continent en deux. Un bouton bascule toute l'interface ; les messages d'erreur et les raisons d'un match suivent. Un test échoue si un texte de l'interface ou un message d'erreur n'a pas sa traduction.

### Questions probables

> **« Pourquoi pas des cercles de 5 ou plus ? »**
> Au-delà de 4, la coordination devient irréaliste (il faut que tout le monde dise oui) et le nombre de cycles à examiner explose. Et un cercle dont deux membres se complètent déjà directement n'est jamais proposé : l'échange à deux reste plus simple.

> **« Qu'est-ce qui empêche de se valider entre amis ? »**
> Il faut un échange **terminé** entre les deux, ou un cercle **actif**, donc accepté par chacun. Ça n'empêche pas une complaisance entre deux personnes décidées à tricher, mais la validation porte leur nom et leur pays, publiquement : elle engage celui qui la donne. C'est pourquoi nous n'avons pas mis de note sur 5, qui inviterait à la complaisance ou à la revanche.

> **« L'observatoire ne révèle-t-il pas des données personnelles ? »**
> Il n'expose que des comptes (« 3 développeurs proposent Docker au Kenya »), jamais qui. Les compétences et le pays de chacun sont déjà publics sur son profil ; l'observatoire ne fait que les additionner.

> **« Comment la traduction reste-t-elle complète ? »**
> Le texte français sert de clé (`t('Tableau de bord')`), et un test lit le code source pour vérifier que chaque texte a son anglais. Côté serveur, un test parcourt le code Python et échoue si un message d'erreur n'est pas traduit.

---

## 10. Ce que nous n'avons pas fait, et pourquoi

L'honnêteté sur les limites vaut mieux qu'une promesse non tenue.

- **L'IA reste un complément, désactivée par défaut.** Le cahier plaçait ces fonctions en dernier et facultatives. Elles existent (extraction de compétences, recherche en langage naturel, résumé de projet, phrase d'explication d'un match, DevLink Copilot), mais le produit fonctionne entièrement sans elles, ce qui était l'exigence première : `AI_ENABLED=false` est la valeur par défaut, et un test vérifie que toutes les routes principales répondent sans IA. Le score de Dev Match n'est jamais calculé par une IA.
- **Pas de messagerie temps réel.** Hors périmètre assumé. Un échange accepté révèle le moyen de contact choisi par chacun (e-mail ou lien `https`) ; la conversation se poursuit ailleurs.
- **Throttling par worker**, voir section 5.
- **Compétences déclaratives**, atténuées par les preuves et par les validations des pairs, voir sections 2 et 9.
- **Le contenu saisi n'est pas traduit.** Bios et descriptions de projets restent dans la langue de leur auteur.

---

## 11. Répartition pour l'oral

| Partie | Qui | Durée visée |
|---|---|---|
| Le problème et la vision | Omar | 2 min |
| Démonstration du parcours (8 étapes) | Emmanuel | 4 min |
| Dev Match et son explication | Omar | 2 min |
| Ce qui nous distingue : cercle, observatoire, validations, anglais | Omar | 2 min |
| Architecture, base de données, sécurité | Achraf | 2 min |
| Conformité (licences, IA, données personnelles) | Achraf | 1 min |

Chacun répète deux fois au minimum (DL-52, DL-57, DL-61).
