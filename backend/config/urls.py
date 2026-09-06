from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import CustomTokenObtainPairView

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


urlpatterns = [

    # Django Admin
    path(
        "admin/",
        admin.site.urls
    ),

    # Authentication
    path(
        "api/auth/",
        include("accounts.urls")
    ),

    # JWT Login
    path(
        "api/auth/login/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    # JWT Refresh
    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Tickets
    path(
        "api/tickets/",
        include("tickets.urls"),
    ),

    # Swagger / OpenAPI
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),

    path(
        "api/redoc/",
        SpectacularRedocView.as_view(
            url_name="redoc"
        ),
        name="redoc",
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )