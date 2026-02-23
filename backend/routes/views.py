"""
Views for the routes app.

Endpoints
---------
GET  /routes/driver/{id}/      — list all routes for a specific driver
POST /routes/recalculate/      — trigger on-demand route recalculation
GET  /routes/                  — list all routes (admin only)
GET  /routes/{id}/             — retrieve single route with ordered stops
PATCH /routes/{id}/status/     — update route status (driver)
"""
import logging
from typing import TYPE_CHECKING

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from users.permissions import IsAdminRole, IsAdminOrDriver, IsOwnerOrAdmin
from .models import Route
from .serializers import (
    RecalculateRouteSerializer,
    RouteSummarySerializer,
    RouteSerializer,
)
from .tasks import recalculate_route_for_driver
from .utils import save_route_result

if TYPE_CHECKING:
    from celery.result import AsyncResult

logger = logging.getLogger(__name__)


class RouteListView(generics.ListAPIView):
    """
    GET /routes/

    Admin-only: list all routes across all drivers.
    Supports filtering by driver_id and status.
    """

    serializer_class = RouteSummarySerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = Route.objects.select_related("driver").prefetch_related("stops")

        driver_id = self.request.query_params.get("driver_id")
        if driver_id:
            qs = qs.filter(driver_id=driver_id)

        route_status = self.request.query_params.get("status")
        if route_status:
            qs = qs.filter(status=route_status)

        active_only = self.request.query_params.get("active_only")
        if active_only == "true":
            qs = qs.filter(is_active=True)

        return qs.order_by("-created_at")


class DriverRouteListView(generics.ListAPIView):
    """
    GET /routes/driver/{id}/

    Returns all routes assigned to a specific driver.
    Drivers can only view their own routes; admins can view any driver's routes.
    """

    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        driver_id = self.kwargs["driver_id"]

        # Drivers may only access their own routes
        if self.request.user.role == "driver" and self.request.user.pk != int(driver_id):
            return Route.objects.none()

        return (
            Route.objects.filter(driver_id=driver_id)
            .select_related("driver")
            .prefetch_related("stops__container")
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        driver_id = self.kwargs["driver_id"]
        # Verify the driver exists
        if not User.objects.filter(pk=driver_id, role="driver").exists():
            return Response(
                {"detail": f"Driver with id={driver_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return super().list(request, *args, **kwargs)


class RouteDetailView(generics.RetrieveAPIView):
    """
    GET /routes/{id}/

    Returns full route with ordered stops and container details.
    Drivers can only view their own routes.
    """

    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return (
            Route.objects.select_related("driver")
            .prefetch_related("stops__container")
            .all()
        )


class RouteStatusUpdateView(APIView):
    """
    PATCH /routes/{id}/status/

    Allows a driver to update the status of their own route.
    Valid transitions: pending → in_progress → completed | cancelled
    """

    permission_classes = [IsAuthenticated]

    VALID_TRANSITIONS = {
        "pending": {"in_progress", "cancelled"},
        "in_progress": {"completed", "cancelled"},
    }

    def patch(self, request, pk):
        try:
            route = Route.objects.get(pk=pk)
        except Route.DoesNotExist:
            return Response({"detail": "Route not found."}, status=status.HTTP_404_NOT_FOUND)

        # Permission: driver can only update their own route
        if request.user.role == "driver" and route.driver != request.user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        if not new_status:
            return Response({"detail": "status field is required."}, status=status.HTTP_400_BAD_REQUEST)

        allowed = self.VALID_TRANSITIONS.get(route.status, set())
        if new_status not in allowed:
            return Response(
                {"detail": f"Cannot transition from '{route.status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        route.status = new_status
        route.save(update_fields=["status"])
        return Response(RouteSerializer(route).data)


class RecalculateRouteView(APIView):
    """
    POST /routes/recalculate/

    Triggers on-demand route optimisation for a driver.
    Runs synchronously for fast responses (< 30s) or can be queued via Celery.

    Request body:
        {
            "driver_id": 5,
            "depot_longitude": 71.4460,
            "depot_latitude": 51.1801,
            "threshold": 65   // optional, overrides settings.FILL_LEVEL_THRESHOLD
        }

    Response:
        {
            "route_id": 42,
            "driver_id": 5,
            "container_count": 8,
            "total_distance_km": 34.7,
            "estimated_time_min": 69.4,
            "estimated_co2_kg": 12.3,
            "polyline": "...",
            "solver_status": "optimal",
            "task_id": null   // set if async=true query param used
        }
    """

    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = RecalculateRouteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        driver = serializer.driver_instance
        depot_lon = data["depot_longitude"]
        depot_lat = data["depot_latitude"]
        threshold = data.get("threshold")

        use_async = request.query_params.get("async", "false").lower() == "true"

        if use_async:
            # Queue via Celery for long-running jobs
            task = recalculate_route_for_driver.delay(  # type: ignore
                driver_id=driver.pk,
                depot_lon=depot_lon,
                depot_lat=depot_lat,
                threshold=threshold,
            )
            return Response(
                {"task_id": task.id, "driver_id": driver.pk, "status": "queued"},
                status=status.HTTP_202_ACCEPTED,
            )

        # Synchronous: run inline for fast responses
        from .optimizer import WasteRouteOptimizer

        optimizer = WasteRouteOptimizer(
            driver=driver,
            depot_coords=(depot_lon, depot_lat),
            threshold=threshold,
        )
        result = optimizer.optimize()

        if not result["ordered_containers"]:
            return Response(
                {
                    "detail": "No containers above the fill threshold. No route created.",
                    "solver_status": result["solver_status"],
                    "threshold": optimizer.threshold,
                },
                status=status.HTTP_200_OK,
            )

        route = save_route_result(driver, result)
        logger.info(
            "Manual recalculation: Route #%d for driver %s — %d stops",
            route.pk, driver.email, len(result["ordered_containers"]),
        )

        return Response(
            {
                "route_id": route.pk,
                "driver_id": driver.pk,
                "container_count": len(result["ordered_containers"]),
                "total_distance_km": result["total_distance_km"],
                "estimated_time_min": result["estimated_time_min"],
                "estimated_co2_kg": result["estimated_co2_kg"],
                "polyline": result["polyline"],
                "solver_status": result["solver_status"],
                "task_id": None,
            },
            status=status.HTTP_201_CREATED,
        )
