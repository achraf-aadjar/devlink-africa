from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

api_v1 = [
    path("", include("core.urls")),
    path("auth/", include("accounts.urls")),
    path("", include("profiles.urls")),
    path("", include("skills.urls")),
    path("", include("matching.urls")),
    path("", include("exchanges.urls")),
    path("", include("projects.urls")),
    path("", include("reports.urls")),
    path("", include("search.urls")),
    path("", include("ai.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
