"""Moteur de score de Dev Match.

**Domaine pur** : ce module n'importe ni Django ni la base de données. Il reçoit
deux profils sous forme de structures simples et renvoie un score expliqué. Il se
teste donc directement, sans base, et c'est ce qui le rend vérifiable.

Principe : deux développeurs se correspondent quand ce que l'un sait répond à ce
que l'autre veut apprendre, **dans les deux sens**. Un échange à sens unique
(l'un enseigne, l'autre n'a rien à offrir) est plafonné : voir `ONE_WAY_CAP`.

Toute modification de l'algorithme met à jour les tests et docs/ARCHITECTURE.md.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# --- Poids des critères (somme = 100) ---------------------------------------
# Fixés par le cahier des charges. Ils vivent ici, en un seul endroit, pour
# qu'une modification soit visible en revue de code.
WEIGHTS: dict[str, int] = {
    "complementarity": 35,  # ce que l'un sait et que l'autre veut apprendre
    "reciprocity": 20,  # l'échange va-t-il dans les deux sens ?
    "collaboration": 15,  # disponibilités compatibles
    "common_tech": 10,  # socle technique partagé
    "availability": 10,  # des créneaux sont déclarés
    "domain": 10,  # même domaine d'activité
}

LABELS: dict[str, str] = {
    "complementarity": "Complémentarité",
    "reciprocity": "Réciprocité",
    "collaboration": "Envie de collaborer",
    "common_tech": "Technologies communes",
    "availability": "Disponibilité",
    "domain": "Domaine",
}

#: Score maximal d'un match à sens unique. Sans réciprocité, la plateforme ne
#: propose pas un échange mais un service : le score doit rester modéré.
ONE_WAY_CAP = 55.0

#: Poids d'un niveau déclaré dans la qualité d'un apport.
LEVEL_VALUE: dict[str, float] = {
    "BEGINNER": 0.5,
    "INTERMEDIATE": 0.8,
    "ADVANCED": 1.0,
}

#: Disponibilités qui traduisent une envie de travailler avec quelqu'un.
COLLABORATIVE = frozenset({"MENTORING", "COLLABORATION", "OPEN_SOURCE"})


def normalise(value: str) -> str:
    """Clé de comparaison d'une compétence : casse et espaces ignorés.

    « react », « React » et «  REACT  » désignent la même compétence.
    """
    return " ".join(value.split()).casefold()


@dataclass(frozen=True)
class SkillRef:
    """Une compétence déclarée par un utilisateur."""

    name: str
    level: str = "BEGINNER"

    @property
    def key(self) -> str:
        return normalise(self.name)

    @property
    def value(self) -> float:
        return LEVEL_VALUE.get(self.level.upper(), LEVEL_VALUE["BEGINNER"])


@dataclass(frozen=True)
class ProfileInput:
    """Les données d'un profil utiles au calcul du score."""

    offered: tuple[SkillRef, ...] = ()
    wanted: tuple[SkillRef, ...] = ()
    availability: frozenset[str] = frozenset()
    domains: frozenset[str] = frozenset()
    country: str = ""


@dataclass
class CriterionScore:
    """Points obtenus sur un critère, et sa part maximale."""

    criterion: str
    points: float

    @property
    def label(self) -> str:
        return LABELS[self.criterion]

    @property
    def weight(self) -> int:
        return WEIGHTS[self.criterion]


@dataclass
class MatchExplanation:
    """Résultat complet : le score, sa répartition, et de quoi l'expliquer."""

    score: float
    breakdown: list[CriterionScore]
    a_can_teach_b: list[SkillRef] = field(default_factory=list)
    b_can_teach_a: list[SkillRef] = field(default_factory=list)
    common_skills: list[SkillRef] = field(default_factory=list)
    capped: bool = False

    def as_dict(self) -> dict:
        """Forme sérialisable, telle qu'elle est stockée dans Match.explanation."""
        return {
            "breakdown": [
                {
                    "criterion": item.criterion,
                    "label": item.label,
                    "weight": item.weight,
                    "points": round(item.points, 2),
                }
                for item in self.breakdown
            ],
            "a_can_teach_b": [{"name": s.name, "level": s.level} for s in self.a_can_teach_b],
            "b_can_teach_a": [{"name": s.name, "level": s.level} for s in self.b_can_teach_a],
            "common_skills": [{"name": s.name} for s in self.common_skills],
            "capped": self.capped,
        }


def _unique_by_key(skills: tuple[SkillRef, ...]) -> dict[str, SkillRef]:
    """Dédoublonne par clé normalisée, en gardant le niveau le plus élevé.

    Un utilisateur peut avoir déclaré « React » et « react » : c'est une seule
    compétence, et c'est le meilleur niveau qui compte.
    """
    best: dict[str, SkillRef] = {}
    for skill in skills:
        current = best.get(skill.key)
        if current is None or skill.value > current.value:
            best[skill.key] = skill
    return best


def _teachable(teacher_offered: dict[str, SkillRef], learner_wanted: dict[str, SkillRef]) -> list[SkillRef]:
    """Compétences que l'enseignant propose et que l'apprenant recherche."""
    return [teacher_offered[key] for key in sorted(teacher_offered.keys() & learner_wanted.keys())]


def _complementarity_points(
    a_to_b: list[SkillRef], b_to_a: list[SkillRef], a_wants: int, b_wants: int
) -> float:
    """Part des souhaits satisfaits, pondérée par le niveau de l'enseignant.

    On raisonne par rapport à ce qui est *demandé* : couvrir 2 souhaits sur 2
    vaut mieux que couvrir 2 souhaits sur 10.
    """
    if a_wants == 0 and b_wants == 0:
        return 0.0

    ratios: list[float] = []
    if b_wants:
        quality = sum(skill.value for skill in a_to_b) / b_wants
        ratios.append(min(quality, 1.0))
    if a_wants:
        quality = sum(skill.value for skill in b_to_a) / a_wants
        ratios.append(min(quality, 1.0))

    return (sum(ratios) / len(ratios)) * WEIGHTS["complementarity"]


def _reciprocity_points(a_to_b: list[SkillRef], b_to_a: list[SkillRef]) -> float:
    """Tout ou rien : l'échange va dans les deux sens, ou il n'y a pas d'échange."""
    if a_to_b and b_to_a:
        return float(WEIGHTS["reciprocity"])
    return 0.0


def _collaboration_points(a: ProfileInput, b: ProfileInput) -> float:
    """Disponibilités tournées vers le travail commun, et partagées."""
    a_collab = a.availability & COLLABORATIVE
    b_collab = b.availability & COLLABORATIVE
    if not a_collab or not b_collab:
        return 0.0

    shared = a_collab & b_collab
    # Deux personnes ouvertes à la collaboration valent déjà la moitié des points ;
    # un créneau commun vaut la totalité.
    ratio = 1.0 if shared else 0.5
    return ratio * WEIGHTS["collaboration"]


def _common_tech_points(
    a_offered: dict[str, SkillRef], b_offered: dict[str, SkillRef]
) -> tuple[float, list[SkillRef]]:
    """Socle technique partagé : des compétences proposées de part et d'autre."""
    shared_keys = sorted(a_offered.keys() & b_offered.keys())
    if not shared_keys:
        return 0.0, []

    common = [a_offered[key] for key in shared_keys]
    smaller = min(len(a_offered), len(b_offered))
    ratio = min(len(shared_keys) / smaller, 1.0) if smaller else 0.0
    return ratio * WEIGHTS["common_tech"], common


def _availability_points(a: ProfileInput, b: ProfileInput) -> float:
    """Des créneaux sont-ils déclarés de part et d'autre ?"""
    if not a.availability or not b.availability:
        return 0.0
    if a.availability & b.availability:
        return float(WEIGHTS["availability"])
    # Deux personnes disponibles, mais sur des créneaux différents.
    return WEIGHTS["availability"] * 0.5


def _domain_points(a: ProfileInput, b: ProfileInput) -> float:
    """Domaines d'activité en commun."""
    if not a.domains or not b.domains:
        return 0.0
    shared = a.domains & b.domains
    if not shared:
        return 0.0
    ratio = len(shared) / min(len(a.domains), len(b.domains))
    return min(ratio, 1.0) * WEIGHTS["domain"]


def score_pair(a: ProfileInput, b: ProfileInput) -> MatchExplanation:
    """Calcule le score d'une paire de profils.

    Le résultat est **symétrique** : `score_pair(a, b)` et `score_pair(b, a)`
    donnent le même score. Le score est borné entre 0 et 100, et la somme des
    points de la répartition lui est égale.
    """
    a_offered = _unique_by_key(a.offered)
    b_offered = _unique_by_key(b.offered)
    a_wanted = _unique_by_key(a.wanted)
    b_wanted = _unique_by_key(b.wanted)

    # Une compétence que l'on propose déjà n'est pas un besoin d'apprentissage.
    a_wanted = {key: skill for key, skill in a_wanted.items() if key not in a_offered}
    b_wanted = {key: skill for key, skill in b_wanted.items() if key not in b_offered}

    a_to_b = _teachable(a_offered, b_wanted)
    b_to_a = _teachable(b_offered, a_wanted)

    common_points, common = _common_tech_points(a_offered, b_offered)

    breakdown = [
        CriterionScore(
            "complementarity",
            _complementarity_points(a_to_b, b_to_a, len(a_wanted), len(b_wanted)),
        ),
        CriterionScore("reciprocity", _reciprocity_points(a_to_b, b_to_a)),
        CriterionScore("collaboration", _collaboration_points(a, b)),
        CriterionScore("common_tech", common_points),
        CriterionScore("availability", _availability_points(a, b)),
        CriterionScore("domain", _domain_points(a, b)),
    ]

    total = sum(item.points for item in breakdown)

    # Plafond du sens unique : au moins un côté n'a rien à apprendre à l'autre.
    capped = False
    if not (a_to_b and b_to_a) and total > ONE_WAY_CAP:
        factor = ONE_WAY_CAP / total
        for item in breakdown:
            item.points *= factor
        total = ONE_WAY_CAP
        capped = True

    total = max(0.0, min(100.0, total))

    return MatchExplanation(
        score=round(total, 2),
        breakdown=breakdown,
        a_can_teach_b=a_to_b,
        b_can_teach_a=b_to_a,
        common_skills=common,
        capped=capped,
    )


def reasons_for(explanation: MatchExplanation, a_name: str, b_name: str) -> list[str]:
    """Phrases d'explication, du point de vue de A. Source de vérité : le calcul.

    Ces phrases sont construites à partir des résultats du score, jamais
    l'inverse : l'explication affichée reflète donc toujours le calcul réel.
    """
    sentences: list[str] = []

    for skill in explanation.b_can_teach_a[:3]:
        sentences.append(f"{b_name} peut vous apprendre {skill.name}.")
    for skill in explanation.a_can_teach_b[:3]:
        sentences.append(f"Vous pouvez apprendre {skill.name} à {b_name}.")

    if explanation.common_skills:
        names = ", ".join(skill.name for skill in explanation.common_skills[:3])
        sentences.append(f"Vous maîtrisez tous les deux : {names}.")

    collaboration = next(item for item in explanation.breakdown if item.criterion == "collaboration")
    if collaboration.points > 0:
        sentences.append("Vous êtes tous les deux ouverts à la collaboration.")

    # Sens unique : au moins un des deux n'a rien à apprendre à l'autre. On le dit,
    # car c'est actionnable (il suffit de déclarer des compétences recherchées).
    if not (explanation.a_can_teach_b and explanation.b_can_teach_a):
        sentences.append(
            "L'échange est à sens unique pour le moment : déclarez des compétences "
            "recherchées pour améliorer ce match."
        )

    if not sentences:
        sentences.append(
            "Aucune complémentarité détectée : déclarez vos compétences pour affiner vos matchs."
        )

    return sentences
