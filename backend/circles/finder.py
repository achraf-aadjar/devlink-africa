"""Recherche des cercles d'échange.

**Domaine pur**, comme `matching/scoring.py` : ni Django ni base de données.

Dev Match cherche des **paires** : A apprend quelque chose à B, et B à A. Mais
cette paire parfaite manque souvent. Un cercle généralise l'idée à trois ou
quatre personnes : A apprend à B, B apprend à C, C apprend à A. Chacun donne et
chacun reçoit, sans qu'aucune paire ne soit réciproque.

Modèle : un graphe orienté dont les sommets sont les développeurs. Une flèche
u → v existe quand u sait faire une compétence que v veut apprendre. Un cercle
est un cycle simple de ce graphe, de longueur 3 ou 4. Les cycles de longueur 2
sont les matchs réciproques de Dev Match : on ne les reproduit pas ici.

Le principe est celui des chaînes de dons croisés (de rein, par exemple) :
quand l'échange direct est impossible, on le fait circuler.
"""

from __future__ import annotations

from dataclasses import dataclass

from matching.scoring import ProfileInput, SkillRef, normalise

#: Tailles de cercle recherchées. Au-delà de quatre, la coordination devient
#: trop lourde pour un échange entre inconnus.
MIN_SIZE = 3
MAX_SIZE = 4

#: Un cercle à quatre demande plus de coordination qu'un cercle à trois :
#: son score est réduit d'autant, à qualité de flèches égale.
SIZE_PENALTY = {3: 1.0, 4: 0.9}

#: Nombre maximal de cercles proposés à une personne : les meilleurs seulement.
DEFAULT_LIMIT = 5


@dataclass(frozen=True)
class Arrow:
    """Une flèche du cercle : `teacher` apprend `skill` à `learner`."""

    teacher: int
    learner: int
    skill: SkillRef


@dataclass(frozen=True)
class Circle:
    """Un cercle d'échange : ses membres dans l'ordre, et ses flèches."""

    members: tuple[int, ...]
    arrows: tuple[Arrow, ...]
    score: float

    @property
    def key(self) -> str:
        """Identifiant stable du cercle, quel que soit son point de départ."""
        return circle_key(self.members)


def circle_key(members: tuple[int, ...] | list[int]) -> str:
    """Clé canonique : rotation qui place le plus petit identifiant en tête.

    Le sens compte (A → B → C n'est pas A → C → B : les flèches diffèrent), le
    point de départ non. « 3-7-5 », « 7-5-3 » et « 5-3-7 » donnent « 3-7-5 ».
    """
    members = list(members)
    start = members.index(min(members))
    rotated = members[start:] + members[:start]
    return "-".join(str(member) for member in rotated)


def best_skill(teacher: ProfileInput, learner: ProfileInput) -> SkillRef | None:
    """La meilleure compétence que `teacher` peut apprendre à `learner`.

    « Meilleure » : celle que le professeur maîtrise le mieux ; à égalité,
    l'ordre alphabétique, pour un résultat stable d'un calcul à l'autre.
    """
    wanted = {skill.key for skill in learner.wanted}
    candidates = [skill for skill in teacher.offered if skill.key in wanted]
    if not candidates:
        return None
    return min(candidates, key=lambda skill: (-skill.value, normalise(skill.name)))


def build_graph(profiles: dict[int, ProfileInput]) -> dict[int, dict[int, SkillRef]]:
    """Graphe « peut apprendre à » : graph[u][v] est la compétence que u apprend à v."""
    graph: dict[int, dict[int, SkillRef]] = {user_id: {} for user_id in profiles}

    # Index inversé : pour chaque compétence voulue, qui la veut. Évite de
    # comparer chaque paire de profils quand la plupart n'ont rien en commun.
    wanted_by: dict[str, set[int]] = {}
    for user_id, profile in profiles.items():
        for skill in profile.wanted:
            wanted_by.setdefault(skill.key, set()).add(user_id)

    for teacher_id, teacher in profiles.items():
        learners: set[int] = set()
        for skill in teacher.offered:
            learners |= wanted_by.get(skill.key, set())
        learners.discard(teacher_id)
        for learner_id in learners:
            skill = best_skill(teacher, profiles[learner_id])
            if skill is not None:
                graph[teacher_id][learner_id] = skill

    return graph


def score_circle(arrows: tuple[Arrow, ...]) -> float:
    """Score sur 100 : qualité moyenne des flèches, réduite pour un cercle à quatre.

    La qualité d'une flèche est le niveau du professeur dans la compétence
    transmise (débutant 0,5, intermédiaire 0,8, avancé 1). Un cercle de trois
    professeurs avancés vaut donc 100.
    """
    quality = sum(arrow.skill.value for arrow in arrows) / len(arrows)
    return round(100 * quality * SIZE_PENALTY[len(arrows)], 1)


def _make_circle(members: tuple[int, ...], graph: dict[int, dict[int, SkillRef]]) -> Circle:
    arrows = tuple(
        Arrow(
            teacher=member,
            learner=members[(index + 1) % len(members)],
            skill=graph[member][members[(index + 1) % len(members)]],
        )
        for index, member in enumerate(members)
    )
    return Circle(members=members, arrows=arrows, score=score_circle(arrows))


def _is_mutual(graph: dict[int, dict[int, SkillRef]], a: int, b: int) -> bool:
    return b in graph.get(a, {}) and a in graph.get(b, {})


def find_circles_for(
    user_id: int,
    profiles: dict[int, ProfileInput],
    *,
    limit: int = DEFAULT_LIMIT,
    graph: dict[int, dict[int, SkillRef]] | None = None,
) -> list[Circle]:
    """Les meilleurs cercles qui passent par `user_id`, du meilleur au moins bon.

    Un cercle est écarté si deux de ses membres voisins forment déjà un match
    réciproque : ces deux-là n'ont pas besoin du cercle, Dev Match les a déjà
    réunis. Le cercle sert précisément ceux qu'aucune paire ne réunit.

    Coût : on part des flèches sortantes de l'utilisateur et l'on suit au plus
    trois flèches, soit O(d³) pour un degré sortant d. Les flèches restent
    rares (il faut une compétence voulue en face), ce qui garde le calcul
    rapide à l'échelle de la plateforme.
    """
    if graph is None:
        graph = build_graph(profiles)
    if user_id not in graph:
        return []

    found: dict[str, Circle] = {}

    def explore(path: list[int]) -> None:
        current = path[-1]
        for neighbour in graph[current]:
            if neighbour == user_id and len(path) >= MIN_SIZE:
                members = tuple(path)
                if not any(
                    _is_mutual(graph, members[i], members[(i + 1) % len(members)])
                    for i in range(len(members))
                ):
                    circle = _make_circle(members, graph)
                    found.setdefault(circle.key, circle)
            elif neighbour not in path and len(path) < MAX_SIZE:
                explore([*path, neighbour])

    explore([user_id])

    ranked = sorted(found.values(), key=lambda circle: (-circle.score, len(circle.members), circle.key))
    return ranked[:limit]


def validate_circle(members: list[int], profiles: dict[int, ProfileInput]) -> Circle | None:
    """Reconstruit un cercle proposé, ou None s'il n'est plus valable.

    Les compétences ont pu changer entre la suggestion et la proposition :
    chaque flèche est revérifiée sur les données actuelles.
    """
    if not MIN_SIZE <= len(members) <= MAX_SIZE or len(set(members)) != len(members):
        return None
    if any(member not in profiles for member in members):
        return None

    graph: dict[int, dict[int, SkillRef]] = {member: {} for member in members}
    for index, member in enumerate(members):
        learner = members[(index + 1) % len(members)]
        skill = best_skill(profiles[member], profiles[learner])
        if skill is None:
            return None
        graph[member][learner] = skill

    return _make_circle(tuple(members), graph)
