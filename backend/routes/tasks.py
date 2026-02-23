"""
Celery background task: periodic route recalculation.

Triggered every hour by Celery Beat (see config/celery.py).
For each active driver, recalculates the optimal route from the configured
depot coordinates (falls back to a central depot if not configured).
"""
import logging
from typing import Optional

from celery import shared_task

logger = logging.getLogger(__name__)

# Default depot coordinates if not set per-driver.
# Override by setting DEPOT_LONGITUDE / DEPOT_LATITUDE in settings.
DEFAULT_DEPOT = (0.0, 0.0)


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def recalculate_all_routes(self):
    """
    Runs every hour (configured in config/celery.py beat_schedule).

    For each active driver:
      1. Instantiates WasteRouteOptimizer with the driver and depot coords
      2. Runs the VRP solver
      3. Saves the resulting Route + RouteStop records
      4. Deactivates previous active routes for that driver

    Returns a summary dict of processed drivers.
    """
    from django.conf import settings
    from users.models import User
    from routes.optimizer import WasteRouteOptimizer
    from routes.utils import save_route_result

    depot_lon = getattr(settings, "DEPOT_LONGITUDE", DEFAULT_DEPOT[0])
    depot_lat = getattr(settings, "DEPOT_LATITUDE", DEFAULT_DEPOT[1])
    depot_coords = (depot_lon, depot_lat)

    drivers = User.objects.filter(role="driver", is_active=True)
    results = []

    for driver in drivers:
        try:
            optimizer = WasteRouteOptimizer(driver=driver, depot_coords=depot_coords)
            result = optimizer.optimize()

            if result["ordered_containers"]:
                route = save_route_result(driver, result)
                logger.info(
                    "Route #%d created for driver %s — %d stops, %.2f kg CO₂",
                    route.pk, driver.email, len(result["ordered_containers"]),
                    result["estimated_co2_kg"],
                )
                results.append({
                    "driver_id": driver.pk,
                    "route_id": route.pk,
                    "containers": len(result["ordered_containers"]),
                    "co2_kg": result["estimated_co2_kg"],
                    "status": result["solver_status"],
                })
            else:
                logger.info("No route needed for driver %s.", driver.email)
                results.append({"driver_id": driver.pk, "route_id": None, "status": "no_containers"})

        except Exception as exc:
            logger.error("Route optimisation failed for driver %s: %s", driver.email, exc)
            try:
                raise self.retry(exc=exc)
            except self.MaxRetriesExceededError:
                results.append({"driver_id": driver.pk, "error": str(exc)})

    return {"processed_drivers": len(drivers), "routes": results}


@shared_task
def recalculate_route_for_driver(driver_id, depot_lon, depot_lat, threshold=None):
    """
    On-demand route recalculation for a single driver.
    Called by POST /routes/recalculate/ view.
    """
    from users.models import User
    from routes.optimizer import WasteRouteOptimizer
    from routes.utils import save_route_result

    try:
        driver = User.objects.get(pk=driver_id, role="driver", is_active=True)
    except User.DoesNotExist:
        logger.error("Driver id=%d not found.", driver_id)
        return {"error": f"Driver {driver_id} not found."}

    optimizer = WasteRouteOptimizer(
        driver=driver,
        depot_coords=(depot_lon, depot_lat),
        threshold=threshold,
    )
    result = optimizer.optimize()

    if result["ordered_containers"]:
        route = save_route_result(driver, result)
        logger.info(
            "On-demand route #%d created for driver %s.", route.pk, driver.email
        )
        return {"route_id": route.pk, "status": result["solver_status"]}

    return {"route_id": None, "status": "no_containers"}
