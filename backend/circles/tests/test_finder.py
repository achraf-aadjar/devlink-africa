"""Tests du moteur de cercles : fonction pure, aucune base de données."""

from circles.finder import (
    MAX_SIZE,
    best_skill,
    build_graph,
    circle_key,
    find_circles_for,
    score_circle,
    validate_circle,
)
from matching.scoring import ProfileInput, SkillRef


def dev(offered=(), wanted=()):
    """Profil minimal : compétences proposées (nom ou (nom, niveau)) et voulues."""
    return ProfileInput(
        offered=tuple(
            SkillRef(*item) if isinstance(item, tuple) else SkillRef(item, "ADVANCED") for item in offered
        ),
        wanted=tuple(SkillRef(name) for name in wanted),
    )


# Awa apprend React à Imani, Imani Python à Kofi, Kofi Docker à Awa.
AWA, KOFI, IMANI = 1, 2, 3
TRIANGLE = {
    AWA: dev(offered=["React"], wanted=["Docker"]),
    KOFI: dev(offered=["Docker"], wanted=["Python"]),
    IMANI: dev(offered=["Python"], wanted=["React"]),
}


# --- Le graphe ---------------------------------------------------------------


def test_an_arrow_exists_only_when_the_learner_wants_the_skill():
    graph = build_graph(TRIANGLE)

    assert graph[AWA] == {IMANI: SkillRef("React", "ADVANCED")}
    assert graph[KOFI] == {AWA: SkillRef("Docker", "ADVANCED")}
    assert graph[IMANI] == {KOFI: SkillRef("Python", "ADVANCED")}


def test_skill_names_are_compared_without_case_or_spaces():
    graph = build_graph({1: dev(offered=["  react "]), 2: dev(wanted=["React"])})

    assert 2 in graph[1]


def test_nobody_teaches_themselves():
    graph = build_graph({1: dev(offered=["React"], wanted=["React"])})

    assert graph[1] == {}


def test_the_best_skill_is_the_one_the_teacher_masters_most():
    teacher = dev(offered=[("Docker", "INTERMEDIATE"), ("Python", "ADVANCED")])
    learner = dev(wanted=["Docker", "Python"])

    assert best_skill(teacher, learner).name == "Python"


def test_equal_levels_are_settled_alphabetically_for_a_stable_result():
    teacher = dev(offered=["Python", "Docker"])
    learner = dev(wanted=["Python", "Docker"])

    assert best_skill(teacher, learner).name == "Docker"


# --- Trouver les cercles -----------------------------------------------------


def test_three_people_without_any_mutual_pair_form_a_circle():
    circles = find_circles_for(AWA, TRIANGLE)

    assert len(circles) == 1
    circle = circles[0]
    assert set(circle.members) == {AWA, KOFI, IMANI}
    assert [(a.teacher, a.learner, a.skill.name) for a in circle.arrows] == [
        (AWA, IMANI, "React"),
        (IMANI, KOFI, "Python"),
        (KOFI, AWA, "Docker"),
    ]


def test_every_member_finds_the_same_circle():
    keys = {find_circles_for(user, TRIANGLE)[0].key for user in TRIANGLE}

    assert keys == {circle_key([AWA, IMANI, KOFI])}


def test_in_a_circle_everyone_gives_once_and_receives_once():
    circle = find_circles_for(KOFI, TRIANGLE)[0]

    assert sorted(a.teacher for a in circle.arrows) == sorted(circle.members)
    assert sorted(a.learner for a in circle.arrows) == sorted(circle.members)


def test_a_mutual_pair_is_left_to_dev_match():
    """Deux personnes qui s'échangent déjà mutuellement n'ont pas besoin d'un cercle."""
    profiles = {
        1: dev(offered=["React"], wanted=["Docker"]),
        2: dev(offered=["Docker"], wanted=["React"]),
    }

    assert find_circles_for(1, profiles) == []


def test_a_circle_containing_a_mutual_pair_is_not_proposed():
    """1 → 2 → 3 → 1 existe, mais 1 et 2 s'échangent déjà mutuellement."""
    profiles = {
        1: dev(offered=["React"], wanted=["Docker", "Rust"]),
        2: dev(offered=["Docker", "Go"], wanted=["React"]),
        3: dev(offered=["Rust"], wanted=["Go"]),
    }
    graph = build_graph(profiles)
    assert 2 in graph[1] and 3 in graph[2] and 1 in graph[3]  # le cycle existe bien

    assert find_circles_for(1, profiles) == []


def test_four_people_can_form_a_circle():
    profiles = {
        1: dev(offered=["A"], wanted=["D"]),
        2: dev(offered=["B"], wanted=["A"]),
        3: dev(offered=["C"], wanted=["B"]),
        4: dev(offered=["D"], wanted=["C"]),
    }

    circles = find_circles_for(1, profiles)

    assert [circle.members for circle in circles] == [(1, 2, 3, 4)]


def test_circles_never_exceed_the_maximum_size():
    # Une chaîne de cinq : le seul cycle possible ferait cinq personnes.
    profiles = {index: dev(offered=[f"S{index}"], wanted=[f"S{(index - 1) % 5}"]) for index in range(5)}

    assert find_circles_for(0, profiles) == []
    assert MAX_SIZE == 4


def test_a_person_with_no_skill_finds_no_circle():
    profiles = {**TRIANGLE, 9: dev()}

    assert find_circles_for(9, profiles) == []


def test_an_unknown_person_finds_no_circle():
    assert find_circles_for(42, TRIANGLE) == []


def test_circles_are_ranked_best_first_and_limited():
    # Deux triangles passant par 1 : l'un d'avancés, l'autre de débutants.
    profiles = {
        1: dev(offered=["React"], wanted=["Docker", "Go"]),
        2: dev(offered=["Docker"], wanted=["Python"]),
        3: dev(offered=["Python"], wanted=["React"]),
        4: dev(offered=[("Go", "BEGINNER")], wanted=["Rust"]),
        5: dev(offered=[("Rust", "BEGINNER")], wanted=["React"]),
    }

    circles = find_circles_for(1, profiles)

    assert [set(circle.members) for circle in circles] == [{1, 2, 3}, {1, 4, 5}]
    assert circles[0].score > circles[1].score
    assert len(find_circles_for(1, profiles, limit=1)) == 1


# --- Le score ------------------------------------------------------------------


def test_three_advanced_teachers_score_100():
    assert find_circles_for(AWA, TRIANGLE)[0].score == 100.0


def test_the_score_is_the_mean_level_of_the_arrows():
    profiles = {
        1: dev(offered=[("React", "BEGINNER")], wanted=["Docker"]),
        2: dev(offered=[("Docker", "INTERMEDIATE")], wanted=["Python"]),
        3: dev(offered=[("Python", "ADVANCED")], wanted=["React"]),
    }

    circle = find_circles_for(1, profiles)[0]

    # (0,5 + 0,8 + 1) / 3 = 0,7667
    assert circle.score == 76.7
    assert score_circle(circle.arrows) == 76.7


def test_a_circle_of_four_costs_ten_percent_for_the_extra_coordination():
    profiles = {
        1: dev(offered=["A"], wanted=["D"]),
        2: dev(offered=["B"], wanted=["A"]),
        3: dev(offered=["C"], wanted=["B"]),
        4: dev(offered=["D"], wanted=["C"]),
    }

    assert find_circles_for(1, profiles)[0].score == 90.0


# --- La clé canonique ----------------------------------------------------------


def test_the_key_ignores_the_starting_point():
    assert circle_key([3, 7, 5]) == circle_key([7, 5, 3]) == circle_key([5, 3, 7]) == "3-7-5"


def test_the_key_keeps_the_direction():
    assert circle_key([3, 7, 5]) != circle_key([3, 5, 7])


# --- Revalider un cercle proposé ------------------------------------------------


def test_a_proposed_circle_is_rebuilt_from_current_data():
    circle = validate_circle([AWA, IMANI, KOFI], TRIANGLE)

    assert circle is not None
    assert circle.score == 100.0


def test_a_circle_whose_arrow_no_longer_holds_is_rejected():
    changed = {**TRIANGLE, KOFI: dev(offered=["Docker"], wanted=["Rust"])}

    assert validate_circle([AWA, IMANI, KOFI], changed) is None


def test_a_circle_in_the_wrong_direction_is_rejected():
    assert validate_circle([AWA, KOFI, IMANI], TRIANGLE) is None


def test_invalid_sizes_and_repeated_members_are_rejected():
    assert validate_circle([AWA, IMANI], TRIANGLE) is None
    assert validate_circle([AWA, IMANI, KOFI, AWA], TRIANGLE) is None
    assert validate_circle([1, 2, 3, 4, 5], TRIANGLE) is None
    assert validate_circle([AWA, IMANI, 99], TRIANGLE) is None
