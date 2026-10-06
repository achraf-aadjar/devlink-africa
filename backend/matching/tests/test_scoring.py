"""Tests du moteur de score (DL-11).

Aucun accès à la base : le module est du domaine pur. Les cas limites listés dans
le ticket sont tous couverts : profil vide, une seule compétence, doublons,
casse et espaces, sens unique, profils identiques, symétrie, bornes 0 à 100.
"""

import pytest

from matching.scoring import (
    ONE_WAY_CAP,
    WEIGHTS,
    MatchExplanation,
    ProfileInput,
    SkillRef,
    normalise,
    reasons_for,
    score_pair,
)


def profile(offered=(), wanted=(), availability=(), domains=(), country=""):
    """Construit un ProfileInput depuis des noms de compétences simples."""
    return ProfileInput(
        offered=tuple(SkillRef(*s) if isinstance(s, tuple) else SkillRef(s) for s in offered),
        wanted=tuple(SkillRef(*s) if isinstance(s, tuple) else SkillRef(s) for s in wanted),
        availability=frozenset(availability),
        domains=frozenset(domains),
        country=country,
    )


# --- Invariants : ils doivent tenir sur toutes les combinaisons -------------

CASES = [
    ("deux profils vides", profile(), profile()),
    ("un seul vide", profile(offered=["Python"], wanted=["React"]), profile()),
    (
        "échange parfait",
        profile(
            offered=[("Python", "ADVANCED")], wanted=["React"], availability=["MENTORING"], domains=["WEB"]
        ),
        profile(
            offered=[("React", "ADVANCED")], wanted=["Python"], availability=["MENTORING"], domains=["WEB"]
        ),
    ),
    (
        "sens unique",
        profile(offered=["Python", "Docker"], wanted=[], availability=["MENTORING"], domains=["WEB"]),
        profile(offered=[], wanted=["Python", "Docker"], availability=["MENTORING"], domains=["WEB"]),
    ),
    (
        "profils identiques",
        profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"]),
        profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"]),
    ),
    (
        "aucun rapport",
        profile(offered=["Python"], wanted=["Docker"], availability=["FREELANCE"], domains=["DATA"]),
        profile(offered=["Flutter"], wanted=["Kubernetes"], availability=["MENTORING"], domains=["MOBILE"]),
    ),
    (
        "tout en commun, tout demandé",
        profile(
            offered=["Python", "React", "Docker"],
            wanted=["Flutter", "Linux"],
            availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
            domains=["WEB", "DATA", "DEVOPS"],
        ),
        profile(
            offered=["Flutter", "Linux", "Python"],
            wanted=["React", "Docker"],
            availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
            domains=["WEB", "DATA", "DEVOPS"],
        ),
    ),
]


@pytest.mark.parametrize("label,a,b", CASES, ids=[case[0] for case in CASES])
def test_score_stays_between_0_and_100(label, a, b):
    result = score_pair(a, b)

    assert 0.0 <= result.score <= 100.0


@pytest.mark.parametrize("label,a,b", CASES, ids=[case[0] for case in CASES])
def test_score_is_symmetric(label, a, b):
    assert score_pair(a, b).score == score_pair(b, a).score


@pytest.mark.parametrize("label,a,b", CASES, ids=[case[0] for case in CASES])
def test_breakdown_sums_to_the_score(label, a, b):
    """L'explication affichée doit être vérifiable : la somme fait le score."""
    result = score_pair(a, b)

    assert sum(item.points for item in result.breakdown) == pytest.approx(result.score, abs=0.01)


@pytest.mark.parametrize("label,a,b", CASES, ids=[case[0] for case in CASES])
def test_no_criterion_exceeds_its_weight(label, a, b):
    for item in score_pair(a, b).breakdown:
        assert item.points <= item.weight + 0.01
        assert item.points >= 0.0


def test_weights_sum_to_100():
    assert sum(WEIGHTS.values()) == 100


# --- Profils vides ----------------------------------------------------------


def test_two_empty_profiles_score_zero():
    result = score_pair(profile(), profile())

    assert result.score == 0.0
    assert result.a_can_teach_b == []
    assert result.b_can_teach_a == []


def test_one_empty_profile_scores_zero():
    full = profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"])

    assert score_pair(full, profile()).score == 0.0


# --- Une seule compétence ---------------------------------------------------


def test_single_skill_each_way_gives_full_complementarity():
    a = profile(offered=[("Python", "ADVANCED")], wanted=["React"])
    b = profile(offered=[("React", "ADVANCED")], wanted=["Python"])

    result = score_pair(a, b)
    points = {item.criterion: item.points for item in result.breakdown}

    assert points["complementarity"] == pytest.approx(WEIGHTS["complementarity"])
    assert points["reciprocity"] == WEIGHTS["reciprocity"]


def test_a_beginner_teacher_contributes_less_than_an_advanced_one():
    learner = profile(offered=["React"], wanted=["Python"])
    beginner = profile(offered=[("Python", "BEGINNER")], wanted=["React"])
    advanced = profile(offered=[("Python", "ADVANCED")], wanted=["React"])

    assert score_pair(learner, beginner).score < score_pair(learner, advanced).score


# --- Doublons, casse et espaces --------------------------------------------


def test_duplicate_skills_are_counted_once():
    a = profile(offered=["Python", "Python", "Python"], wanted=["React"])
    b = profile(offered=["React"], wanted=["Python"])
    reference_a = profile(offered=["Python"], wanted=["React"])

    assert score_pair(a, b).score == score_pair(reference_a, b).score
    assert len(score_pair(a, b).a_can_teach_b) == 1


def test_duplicates_keep_the_highest_level():
    a = profile(offered=[("Python", "BEGINNER"), ("Python", "ADVANCED")], wanted=["React"])
    b = profile(offered=["React"], wanted=["Python"])

    assert score_pair(a, b).a_can_teach_b[0].level == "ADVANCED"


@pytest.mark.parametrize("written", ["react", "REACT", "React", "  React  ", "ReAcT"])
def test_case_and_spaces_are_ignored(written):
    a = profile(offered=["Python"], wanted=[written])
    b = profile(offered=["React"], wanted=["Python"])

    result = score_pair(a, b)

    assert len(result.b_can_teach_a) == 1
    assert result.score == score_pair(profile(offered=["Python"], wanted=["React"]), b).score


def test_normalise_collapses_inner_spaces():
    assert normalise("  UI/UX   Design ") == normalise("ui/ux design")


# --- Sens unique ------------------------------------------------------------


def test_one_way_match_never_reaches_a_high_score():
    """Un côté enseigne, l'autre n'a rien à offrir : ce n'est pas un échange.

    Le ticket exige qu'un tel match « ne soit jamais élevé ». On le vérifie sur
    le cas le plus favorable possible : tout est partagé *sauf* la réciprocité.
    """
    teacher = profile(
        offered=[("Python", "ADVANCED"), ("Docker", "ADVANCED"), ("Linux", "ADVANCED")],
        wanted=[],
        availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
        domains=["WEB", "DEVOPS", "DATA"],
    )
    learner = profile(
        offered=[],
        wanted=["Python", "Docker", "Linux"],
        availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
        domains=["WEB", "DEVOPS", "DATA"],
    )

    result = score_pair(teacher, learner)

    assert result.score <= ONE_WAY_CAP


def test_no_one_way_combination_can_exceed_the_cap():
    """Balayage exhaustif : aucune combinaison à sens unique ne dépasse le plafond."""
    skills = ["Python", "Docker", "Linux", "React"]
    everything = {
        "availability": ["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
        "domains": ["WEB", "DEVOPS", "DATA"],
    }

    for a_offered in range(4):
        for a_wanted in range(4):
            for b_offered in range(4):
                for b_wanted in range(4):
                    a = profile(
                        offered=[(s, "ADVANCED") for s in skills[:a_offered]],
                        wanted=skills[:a_wanted],
                        **everything,
                    )
                    b = profile(
                        offered=[(s, "ADVANCED") for s in skills[:b_offered]],
                        wanted=skills[:b_wanted],
                        **everything,
                    )
                    result = score_pair(a, b)
                    is_one_way = not (result.a_can_teach_b and result.b_can_teach_a)
                    if is_one_way:
                        assert result.score <= ONE_WAY_CAP, (a_offered, a_wanted, b_offered, b_wanted)


def test_one_way_scores_lower_than_reciprocal():
    one_way = score_pair(
        profile(offered=["Python"], wanted=[], availability=["MENTORING"], domains=["WEB"]),
        profile(offered=[], wanted=["Python"], availability=["MENTORING"], domains=["WEB"]),
    )
    reciprocal = score_pair(
        profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"]),
        profile(offered=["React"], wanted=["Python"], availability=["MENTORING"], domains=["WEB"]),
    )

    assert one_way.score < reciprocal.score


def test_capping_keeps_the_breakdown_consistent():
    """Quand le plafond s'applique, la répartition reste égale au score."""
    # Un seul souhait couvert dans un sens, rien en retour : le cas qui plafonne.
    result = score_pair(
        profile(
            offered=[],
            wanted=["Python"],
            availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
            domains=["WEB", "DEVOPS", "DATA"],
        ),
        profile(
            offered=[("Python", "ADVANCED")],
            wanted=[],
            availability=["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"],
            domains=["WEB", "DEVOPS", "DATA"],
        ),
    )

    assert result.capped is True
    assert result.score == pytest.approx(ONE_WAY_CAP, abs=0.01)
    assert sum(item.points for item in result.breakdown) == pytest.approx(result.score, abs=0.01)


def test_reciprocity_is_zero_without_a_return_path():
    result = score_pair(
        profile(offered=["Python"], wanted=[]),
        profile(offered=[], wanted=["Python"]),
    )
    points = {item.criterion: item.points for item in result.breakdown}

    assert points["reciprocity"] == 0.0


# --- Profils identiques -----------------------------------------------------


def test_identical_profiles_have_no_complementarity():
    """Deux personnes qui savent la même chose et veulent la même chose
    n'ont rien à s'échanger, même si elles partagent beaucoup."""
    same = profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"])

    result = score_pair(same, same)
    points = {item.criterion: item.points for item in result.breakdown}

    assert points["complementarity"] == 0.0
    assert points["reciprocity"] == 0.0
    # Mais le socle commun et les disponibilités comptent.
    assert points["common_tech"] == WEIGHTS["common_tech"]
    assert points["collaboration"] == WEIGHTS["collaboration"]


def test_identical_profiles_score_below_a_real_exchange():
    same = profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"])
    exchange_a = profile(offered=["Python"], wanted=["React"], availability=["MENTORING"], domains=["WEB"])
    exchange_b = profile(offered=["React"], wanted=["Python"], availability=["MENTORING"], domains=["WEB"])

    assert score_pair(same, same).score < score_pair(exchange_a, exchange_b).score


# --- Détails des critères ---------------------------------------------------


def test_a_skill_already_offered_is_not_a_learning_need():
    """Déclarer une compétence à la fois sue et recherchée ne crée pas de besoin."""
    a = profile(offered=["Python"], wanted=["Python"])
    b = profile(offered=["Python"], wanted=["React"])

    result = score_pair(a, b)

    assert result.b_can_teach_a == []


def test_covering_all_wishes_beats_covering_some():
    teacher = profile(offered=["Python", "Docker"], wanted=["React"])
    wants_two = profile(offered=["React"], wanted=["Python", "Docker"])
    wants_ten = profile(
        offered=["React"],
        wanted=["Python", "Docker", "Linux", "Flutter", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby"],
    )

    assert score_pair(teacher, wants_two).score > score_pair(teacher, wants_ten).score


def test_shared_availability_beats_different_availability():
    shared = score_pair(
        profile(offered=["Python"], wanted=["React"], availability=["MENTORING"]),
        profile(offered=["React"], wanted=["Python"], availability=["MENTORING"]),
    )
    different = score_pair(
        profile(offered=["Python"], wanted=["React"], availability=["FREELANCE"]),
        profile(offered=["React"], wanted=["Python"], availability=["MENTORING"]),
    )

    assert shared.score > different.score


def test_freelance_only_profiles_get_no_collaboration_points():
    result = score_pair(
        profile(offered=["Python"], wanted=["React"], availability=["FREELANCE"]),
        profile(offered=["React"], wanted=["Python"], availability=["FREELANCE"]),
    )
    points = {item.criterion: item.points for item in result.breakdown}

    assert points["collaboration"] == 0.0


def test_shared_domain_adds_points():
    with_domain = score_pair(
        profile(offered=["Python"], wanted=["React"], domains=["WEB"]),
        profile(offered=["React"], wanted=["Python"], domains=["WEB"]),
    )
    without = score_pair(
        profile(offered=["Python"], wanted=["React"], domains=["DATA"]),
        profile(offered=["React"], wanted=["Python"], domains=["WEB"]),
    )

    assert with_domain.score > without.score


def test_common_skills_are_reported():
    result = score_pair(
        profile(offered=["Python", "Docker"], wanted=["React"]),
        profile(offered=["Docker", "React"], wanted=["Python"]),
    )

    assert [skill.name for skill in result.common_skills] == ["Docker"]


# --- Sérialisation et explications -----------------------------------------


def test_as_dict_is_serialisable_and_complete():
    result = score_pair(
        profile(offered=[("Python", "ADVANCED")], wanted=["React"], availability=["MENTORING"]),
        profile(offered=["React"], wanted=["Python"], availability=["MENTORING"]),
    )

    payload = result.as_dict()

    assert {item["criterion"] for item in payload["breakdown"]} == set(WEIGHTS)
    assert payload["a_can_teach_b"] == [{"name": "Python", "level": "ADVANCED"}]
    assert payload["b_can_teach_a"] == [{"name": "React", "level": "BEGINNER"}]
    assert payload["capped"] is False
    # Doit passer dans un JSONField sans conversion particulière.
    import json

    assert json.loads(json.dumps(payload)) == payload


def test_reasons_describe_both_directions():
    result = score_pair(
        profile(offered=["Python"], wanted=["React"], availability=["MENTORING"]),
        profile(offered=["React"], wanted=["Python"], availability=["MENTORING"]),
    )

    reasons = reasons_for(result, "Ada", "Kofi")

    assert any("Kofi peut vous apprendre React" in reason for reason in reasons)
    assert any("Vous pouvez apprendre Python à Kofi" in reason for reason in reasons)
    assert any("collaboration" in reason for reason in reasons)


def test_reasons_warn_about_a_one_way_match():
    result = score_pair(
        profile(offered=[], wanted=["Python"]),
        profile(
            offered=["Python", "Docker", "Linux"], wanted=[], availability=["MENTORING"], domains=["WEB"]
        ),
    )

    reasons = reasons_for(result, "Ada", "Kofi")

    assert any("sens unique" in reason for reason in reasons)


def test_reasons_are_never_empty():
    reasons = reasons_for(score_pair(profile(), profile()), "Ada", "Kofi")

    assert len(reasons) >= 1
    assert all(reason.strip() for reason in reasons)


def test_explanation_is_a_dataclass_with_a_score():
    result = score_pair(profile(), profile())

    assert isinstance(result, MatchExplanation)
    assert isinstance(result.score, float)
