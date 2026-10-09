from django.urls import path

from .views import (
    CountryChoicesView,
    CountryDetailView,
    CountryListView,
    ObservatoryView,
    ProjectSearchView,
    UserSearchView,
)

urlpatterns = [
    path("search/users/", UserSearchView.as_view(), name="search-users"),
    path("search/projects/", ProjectSearchView.as_view(), name="search-projects"),
    path("observatory/", ObservatoryView.as_view(), name="observatory"),
    path("countries/", CountryListView.as_view(), name="country-list"),
    # Avant <str:code> : sinon « all » serait pris pour un code pays.
    path("countries/all/", CountryChoicesView.as_view(), name="country-choices"),
    path("countries/<str:code>/", CountryDetailView.as_view(), name="country-detail"),
]
