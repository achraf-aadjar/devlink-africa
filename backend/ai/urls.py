from django.urls import path

from .views import (
    AIStatusView,
    ExplainMatchView,
    ExtractSkillsView,
    NaturalSearchView,
    SummarizeProjectView,
)

urlpatterns = [
    path("ai/status/", AIStatusView.as_view(), name="ai-status"),
    path("ai/extract-skills/", ExtractSkillsView.as_view(), name="ai-extract-skills"),
    path("ai/search/", NaturalSearchView.as_view(), name="ai-search"),
    path("ai/summarize-project/", SummarizeProjectView.as_view(), name="ai-summarize-project"),
    path("ai/explain-match/", ExplainMatchView.as_view(), name="ai-explain-match"),
]
