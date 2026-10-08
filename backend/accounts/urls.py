from django.urls import path

from .views import (
    GoogleAuthView,
    GoogleClientIdView,
    LoginView,
    LogoutView,
    RefreshView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("google/", GoogleAuthView.as_view(), name="auth-google"),
    path("google/client-id/", GoogleClientIdView.as_view(), name="auth-google-client-id"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
