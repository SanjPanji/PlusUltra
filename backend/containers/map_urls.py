"""
URL configuration for map/geospatial endpoints.
Mounted at /map/ by config/urls.py.
"""
from django.urls import path

from .map_views import ContainerGeoJSONView, HotspotView

app_name = "map"

urlpatterns = [
    path("containers/geojson/", ContainerGeoJSONView.as_view(), name="containers_geojson"),
    path("hotspots/", HotspotView.as_view(), name="hotspots"),
]
