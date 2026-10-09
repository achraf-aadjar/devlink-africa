from django.urls import path

from .views import CircleDetailView, CircleListView, CircleSuggestionsView

urlpatterns = [
    path("circles/", CircleListView.as_view(), name="circle-list"),
    path("circles/suggestions/", CircleSuggestionsView.as_view(), name="circle-suggestions"),
    path("circles/<int:pk>/", CircleDetailView.as_view(), name="circle-detail"),
]
