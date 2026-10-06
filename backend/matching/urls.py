from django.urls import path

from .views import MatchDetailView, MatchFeedbackView, MatchListView

urlpatterns = [
    path("matches/", MatchListView.as_view(), name="match-list"),
    path("matches/<int:pk>/", MatchDetailView.as_view(), name="match-detail"),
    path("matches/<int:pk>/feedback/", MatchFeedbackView.as_view(), name="match-feedback"),
]
