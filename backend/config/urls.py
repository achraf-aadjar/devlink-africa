from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

api_v1 = [
    path("health/", include("core.urls")),
    path("auth/", include("accounts.urls")),
    # TODO(DL-14): profiles (GET/PATCH /me, GET /users/{id})
    # TODO(DL-15): skills (/skills, /me/skills)
    # TODO(DL-24): matching (/matches, /matches/{id})
    # TODO(DL-18): exchanges (/exchanges)
    # TODO(DL-16): projects (/projects)
    # TODO(DL-32): reports (/reports)
    # TODO(DL-25): search (/search/users, /search/projects)
    # TODO(DL-28): dashboard (/dashboard)
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
