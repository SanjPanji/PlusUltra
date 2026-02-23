"""
WasteRouteOptimizer — OR-Tools VRP solver with CO₂ cost minimisation.

Overview
--------
1. Selects containers with fill_level >= threshold
2. Builds a CO₂-weighted cost matrix between all locations
3. Solves the VRP using Google OR-Tools RoutingModel
4. Returns ordered container list, total metrics, and encoded polyline

CO₂ Cost Model
--------------
The cost between any two stops is not raw distance, but estimated CO₂
emissions accounting for vehicle load at each stop:

    co2_cost(d, fill_pct, factor) = d * factor * (1 + fill_pct / 100 * 0.3)

Where:
    d           = great-circle distance in km (haversine)
    fill_pct    = fill level of the *destination* container (higher = heavier)
    factor      = kg CO₂ per km per tonne (default 0.27, configurable via settings)
    0.3 weight  = extra load coefficient (30% increase at 100% fill)

Usage
-----
    from routes.optimizer import WasteRouteOptimizer
    optimizer = WasteRouteOptimizer(driver=user, depot_coords=(lon, lat))
    result = optimizer.optimize()
"""
import logging
from math import asin, cos, radians, sin, sqrt

from django.conf import settings

logger = logging.getLogger(__name__)

# Metres per degree of latitude (approximate)
_KM_PER_DEGREE = 111.32

# Average vehicle speed for time estimation (km/h)
_AVERAGE_SPEED_KMH = 30

# Seconds per km at average speed
_SECONDS_PER_KM = 3600 / _AVERAGE_SPEED_KMH


def haversine_km(lon1, lat1, lon2, lat2):
    """
    Great-circle distance between two WGS-84 coordinates in kilometres.

    Args:
        lon1, lat1: Origin longitude and latitude in degrees
        lon2, lat2: Destination longitude and latitude in degrees

    Returns:
        Distance in kilometres (float)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 6_371.0 * asin(sqrt(a))


def co2_cost(dist_km, fill_pct, emission_factor=0.27):
    """
    Estimate CO₂ emissions (in kg) for a vehicle travelling dist_km to a
    container at fill_pct% fill level.

    The load factor accounts for the increased fuel consumption from a
    heavier vehicle:

        load_factor = 1 + (fill_pct / 100) × 0.3

    So a fully loaded vehicle (100% fill) emits 30% more CO₂ per km.

    Args:
        dist_km        : Distance in kilometres
        fill_pct       : Destination container fill level (0–100)
        emission_factor: kg CO₂ per km per tonne (default 0.27 from IPCC)

    Returns:
        CO₂ in kilograms (float)
    """
    load_factor = 1.0 + (fill_pct / 100.0) * 0.3
    return dist_km * emission_factor * load_factor


def encode_polyline(coordinates):
    """
    Encode a list of (lat, lon) tuples as a Google Maps encoded polyline string.

    Uses the Encoded Polyline Algorithm Format:
    https://developers.google.com/maps/documentation/utilities/polylinealgorithm

    Args:
        coordinates: List of (latitude, longitude) tuples

    Returns:
        Encoded polyline string
    """
    result = []
    prev_lat = 0
    prev_lng = 0

    for lat, lng in coordinates:
        lat_e5 = round(lat * 1e5)
        lng_e5 = round(lng * 1e5)

        for value in (lat_e5 - prev_lat, lng_e5 - prev_lng):
            value = value << 1
            if value < 0:
                value = ~value
            while value >= 0x20:
                result.append(chr((0x20 | (value & 0x1F)) + 63))
                value >>= 5
            result.append(chr(value + 63))

        prev_lat = lat_e5
        prev_lng = lng_e5

    return "".join(result)


class WasteRouteOptimizer:
    """
    Solves the Capacitated Vehicle Routing Problem for waste collection.

    Parameters
    ----------
    driver       : User instance (role='driver') assigned to the route
    depot_coords : (longitude, latitude) of the depot/garage start point
    threshold    : Minimum fill_level % for a container to be included
    emission_factor: kg CO₂ per km (from settings by default)
    max_solve_seconds: OR-Tools time limit
    """

    def __init__(
        self,
        driver,
        depot_coords: tuple,
        threshold=None,
        emission_factor=None,
        max_solve_seconds: int = 30,
    ):
        self.driver = driver
        self.depot_lon, self.depot_lat = depot_coords
        self.threshold = threshold or getattr(settings, "FILL_LEVEL_THRESHOLD", 70.0)
        self.emission_factor = emission_factor or getattr(settings, "CO2_EMISSION_FACTOR", 0.27)
        self.max_solve_seconds = max_solve_seconds

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def optimize(self) -> dict:
        """
        Run the VRP optimisation.

        Returns
        -------
        dict with keys:
            ordered_containers : list of Container objects in visit order
            total_distance_km  : float
            estimated_time_min : float
            estimated_co2_kg   : float
            polyline           : encoded polyline string
            solver_status      : "optimal" | "feasible" | "no_solution"
        """
        from containers.models import Container

        containers = list(
            Container.objects.filter(
                is_active=True,
                fill_level__gte=self.threshold,
            ).order_by("-fill_level")
        )

        if not containers:
            logger.info("No containers above threshold %.1f%% — no route needed.", self.threshold)
            return self._empty_result("no_containers")

        logger.info(
            "Optimising route for driver %s — %d containers above %.1f%%",
            self.driver.email, len(containers), self.threshold,
        )

        # Build location list: index 0 = depot, 1..N = containers
        locations = [(self.depot_lon, self.depot_lat)] + [
            (c.location.x, c.location.y) for c in containers
        ]
        fill_levels = [0.0] + [c.fill_level for c in containers]

        # Build integer cost matrix (OR-Tools requires integers)
        n = len(locations)
        cost_matrix = self._build_cost_matrix(locations, fill_levels)

        # Try OR-Tools first; fall back to greedy nearest-neighbour
        try:
            ordered_indices, status = self._solve_vrp(cost_matrix, n)
        except ImportError:
            logger.warning("ortools not installed — using greedy nearest-neighbour fallback.")
            ordered_indices, status = self._greedy_nearest_neighbour(cost_matrix, n), "greedy"

        # Reconstruct ordered containers (indices into `containers` list, skipping depot 0)
        ordered_containers = [containers[i - 1] for i in ordered_indices if i != 0]

        # Compute aggregate metrics
        total_distance, total_co2, total_time = self._compute_metrics(
            ordered_indices, locations, fill_levels
        )

        # Build polyline: depot → containers in order → depot
        coords = [(self.depot_lat, self.depot_lon)]
        for c in ordered_containers:
            coords.append((c.location.y, c.location.x))
        coords.append((self.depot_lat, self.depot_lon))
        polyline = encode_polyline(coords)

        return {
            "ordered_containers": ordered_containers,
            "total_distance_km": round(total_distance, 3),
            "estimated_time_min": round(total_time, 1),
            "estimated_co2_kg": round(total_co2, 3),
            "polyline": polyline,
            "solver_status": status,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_cost_matrix(
        self,
        locations,
        fill_levels,
    ):
        """
        Build an N×N integer cost matrix where cost[i][j] represents the
        CO₂ cost of travelling from location i to location j, scaled by 1000
        to preserve 3 decimal places as integers for OR-Tools.
        """
        n = len(locations)
        matrix: list[list[int]] = []

        for i in range(n):
            row: list[int] = []
            lon1, lat1 = locations[i]
            for j in range(n):
                if i == j:
                    row.append(0)
                else:
                    lon2, lat2 = locations[j]
                    dist = haversine_km(lon1, lat1, lon2, lat2)
                    # Use destination's fill level for load weighting
                    co2 = co2_cost(dist, fill_levels[j], self.emission_factor)
                    row.append(int(co2 * 1000))  # scale to integer milligrams
            matrix.append(row)

        return matrix

    def _solve_vrp(self, cost_matrix, n):
        """
        Solve the TSP/VRP using Google OR-Tools.

        Uses a single vehicle (one driver per route). For multi-vehicle
        routing, instantiate multiple WasteRouteOptimizer instances.

        Returns
        -------
        (ordered_indices, status_string)
        ordered_indices: list of location indices to visit in order (starts and ends at 0)
        """
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2

        manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # n nodes, 1 vehicle, depot=0
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return cost_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(self.max_solve_seconds)
        search_parameters.log_search = False

        solution = routing.SolveWithParameters(search_parameters)

        if solution is None:
            logger.warning("OR-Tools found no solution — falling back to greedy.")
            return self._greedy_nearest_neighbour(cost_matrix, n), "no_solution"

        # Extract route
        index = routing.Start(0)
        route = []
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        route.append(0)  # close route at depot

        status = "optimal" if routing.status() == 1 else "feasible"
        logger.info("OR-Tools solved route: %s (status=%s)", route, status)
        return route, status

    def _greedy_nearest_neighbour(self, cost_matrix, n):
        """
        Greedy nearest-neighbour heuristic fallback when OR-Tools is unavailable.
        Starts at depot (index 0) and always visits the cheapest unvisited node.
        """
        unvisited = set(range(1, n))
        route = [0]
        current = 0

        while unvisited:
            nearest = min(unvisited, key=lambda j: cost_matrix[current][j])
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        route.append(0)
        return route

    def _compute_metrics(
        self,
        route,
        locations,
        fill_levels,
    ):
        """
        Compute total distance (km), total CO₂ (kg), and drive time (min)
        for the given node route.
        """
        total_dist = 0.0
        total_co2 = 0.0

        for i in range(len(route) - 1):
            a = route[i]
            b = route[i + 1]
            lon1, lat1 = locations[a]
            lon2, lat2 = locations[b]
            d = haversine_km(lon1, lat1, lon2, lat2)
            total_dist += d
            total_co2 += co2_cost(d, fill_levels[b], self.emission_factor)

        total_time = (total_dist / _AVERAGE_SPEED_KMH) * 60  # minutes
        return total_dist, total_co2, total_time

    @staticmethod
    def _empty_result(reason):
        return {
            "ordered_containers": [],
            "total_distance_km": 0.0,
            "estimated_time_min": 0.0,
            "estimated_co2_kg": 0.0,
            "polyline": "",
            "solver_status": reason,
        }
