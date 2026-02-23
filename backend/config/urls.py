"""
Root URL Configuration for PlusUltra.

Routes:
    /auth/         → users.urls
    /containers/   → containers.urls
    /routes/       → routes.urls
    /map/          → containers.urls (GeoJSON / hotspots)
    /admin/        → Django admin
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", include("users.urls")),
    path("containers/", include("containers.urls")),
    path("routes/", include("routes.urls")),
    path("map/", include("containers.map_urls")),
]
