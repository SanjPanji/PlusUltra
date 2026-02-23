"""
URL configuration for the routes app.
"""
from django.urls import path

from .views import (
    DriverRouteListView,
    RecalculateRouteView,
    RouteDetailView,
    RouteListView,
    RouteStatusUpdateView,
)

app_name = "routes"

urlpatterns = [
    # Admin: all routes
    path("", RouteListView.as_view(), name="route_list"),
    # Single route detail
    path("<int:pk>/", RouteDetailView.as_view(), name="route_detail"),
    # Driver-scoped routes
    path("driver/<int:driver_id>/", DriverRouteListView.as_view(), name="driver_routes"),
    # Route status update
    path("<int:pk>/status/", RouteStatusUpdateView.as_view(), name="route_status"),
    # On-demand optimisation
    path("recalculate/", RecalculateRouteView.as_view(), name="recalculate"),
]
