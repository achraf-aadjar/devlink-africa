from django.urls import path

from accounts.views import DeleteAccountView, ExportMyDataView

from .views import MeView, PublicProfileView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    # Données personnelles (DL-40) : avant <int:user_id> n'est pas nécessaire,
    # les préfixes étant distincts.
    path("me/export/", ExportMyDataView.as_view(), name="me-export"),
    path("me/delete/", DeleteAccountView.as_view(), name="me-delete"),
    path("users/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),
]
