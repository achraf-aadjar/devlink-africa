from django.urls import path

from .views import (
    EndorsementCandidatesView,
    EndorsementCreateView,
    EndorsementDetailView,
    MySkillDetailView,
    MySkillsView,
    SkillCatalogView,
    SkillProofDetailView,
    SkillProofsView,
)

urlpatterns = [
    path("skills/", SkillCatalogView.as_view(), name="skill-catalog"),
    path("endorsements/", EndorsementCreateView.as_view(), name="endorsement-create"),
    path("endorsements/candidates/", EndorsementCandidatesView.as_view(), name="endorsement-candidates"),
    path("endorsements/<int:pk>/", EndorsementDetailView.as_view(), name="endorsement-detail"),
    path("me/skills/", MySkillsView.as_view(), name="my-skills"),
    path("me/skills/<int:pk>/", MySkillDetailView.as_view(), name="my-skill-detail"),
    path("me/skills/<int:user_skill_id>/proofs/", SkillProofsView.as_view(), name="skill-proofs"),
    path(
        "me/skills/<int:user_skill_id>/proofs/<int:pk>/",
        SkillProofDetailView.as_view(),
        name="skill-proof-detail",
    ),
]
