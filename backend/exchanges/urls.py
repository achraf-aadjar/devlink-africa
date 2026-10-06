from django.urls import path

from .views import ExchangeDetailView, ExchangeListView, ExchangeRequestFromMatchView

urlpatterns = [
    path("exchanges/", ExchangeListView.as_view(), name="exchange-list"),
    path("exchanges/<int:pk>/", ExchangeDetailView.as_view(), name="exchange-detail"),
    path(
        "matches/<int:match_id>/request/",
        ExchangeRequestFromMatchView.as_view(),
        name="exchange-request",
    ),
]
