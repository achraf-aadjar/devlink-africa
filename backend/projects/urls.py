from django.urls import path

from .views import (
    JoinRequestDecisionView,
    ProjectDetailView,
    ProjectJoinRequestsView,
    ProjectJoinView,
    ProjectListView,
)

urlpatterns = [
    path("projects/", ProjectListView.as_view(), name="project-list"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:pk>/join/", ProjectJoinView.as_view(), name="project-join"),
    path(
        "projects/<int:pk>/join-requests/",
        ProjectJoinRequestsView.as_view(),
        name="project-join-requests",
    ),
    path("join-requests/<int:pk>/", JoinRequestDecisionView.as_view(), name="join-request-decision"),
]
