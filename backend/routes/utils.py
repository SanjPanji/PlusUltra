"""
Utility helpers for saving route optimisation results to the database.
"""
import logging

from django.db import transaction

logger = logging.getLogger(__name__)


@transaction.atomic
def save_route_result(driver, result: dict):
    """
    Persist an optimisation result as a Route + RouteStop records.

    This function:
      1. Deactivates all previous active routes for the driver
      2. Creates a new Route record
      3. Creates RouteStop records in visit order
      4. Returns the new Route instance

    Args:
        driver : User instance (role='driver')
        result : dict as returned by WasteRouteOptimizer.optimize()

    Returns:
        Route instance
    """
    from routes.models import Route, RouteStop

    # Deactivate previously active routes
    Route.objects.filter(driver=driver, is_active=True).update(is_active=False)

    route = Route.objects.create(
        driver=driver,
        total_distance=result["total_distance_km"],
        estimated_time=result["estimated_time_min"],
        estimated_co2=result["estimated_co2_kg"],
        polyline=result["polyline"],
        is_active=True,
    )

    stops = [
        RouteStop(route=route, container=container, stop_order=idx)
        for idx, container in enumerate(result["ordered_containers"])
    ]
    RouteStop.objects.bulk_create(stops)

    logger.debug(
        "Saved Route #%d with %d stops for driver %s.",
        route.pk, len(stops), driver.email,
    )
    return route
