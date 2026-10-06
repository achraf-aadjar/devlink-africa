from django.urls import path

from .views import CountryDetailView, CountryListView, ProjectSearchView, UserSearchView

urlpatterns = [
    path("search/users/", UserSearchView.as_view(), name="search-users"),
    path("search/projects/", ProjectSearchView.as_view(), name="search-projects"),
    path("countries/", CountryListView.as_view(), name="country-list"),
    path("countries/<str:code>/", CountryDetailView.as_view(), name="country-detail"),
]
