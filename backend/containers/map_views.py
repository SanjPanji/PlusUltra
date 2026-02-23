"""
Map-specific views for waste container geospatial data.

Endpoints
---------
GET /map/containers/geojson/  — GeoJSON FeatureCollection of all active containers
GET /map/hotspots/             — containers above fill threshold, with severity labels
"""
import logging

from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Container
from .serializers import ContainerGeoSerializer, HotspotSerializer

logger = logging.getLogger(__name__)


class ContainerGeoJSONView(APIView):
    """
    GET /map/containers/geojson/

    Returns a GeoJSON FeatureCollection of all active containers.
    Optional query param:
        waste_type : filter by waste type
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Container.objects.filter(is_active=True)

        waste_type = request.query_params.get("waste_type")
        if waste_type:
            qs = qs.filter(waste_type=waste_type)

        features = []
        for container in qs:
            serializer = ContainerGeoSerializer(container)
            features.append({
                "type": "Feature",
                **serializer.data,
            })

        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "total": len(features),
                "threshold": getattr(settings, "FILL_LEVEL_THRESHOLD", 70),
            },
        }
        return Response(geojson)


class HotspotView(APIView):
    """
    GET /map/hotspots/

    Returns containers whose fill_level exceeds the configured threshold.
    Optionally clusters nearby containers (within radius_m metres).

    Query params:
        threshold : override default fill_level threshold (default from settings)
        radius_m  : clustering radius in metres (default 500)
        waste_type: filter by waste type
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        threshold = float(
            request.query_params.get("threshold", getattr(settings, "FILL_LEVEL_THRESHOLD", 70))
        )
        radius_m = float(request.query_params.get("radius_m", 500))
        waste_type = request.query_params.get("waste_type")

        qs = Container.objects.filter(is_active=True, fill_level__gte=threshold)
        if waste_type:
            qs = qs.filter(waste_type=waste_type)

        hotspots = qs.order_by("-fill_level")
        clusters = self._cluster(list(hotspots), radius_m)

        serializer = HotspotSerializer(hotspots, many=True)
        return Response({
            "hotspots": serializer.data,
            "cluster_count": len(clusters),
            "threshold": threshold,
            "radius_m": radius_m,
        })

    @staticmethod
    def _cluster(containers, radius_m):
        """
        Simple greedy spatial clustering.
        Groups containers whose locations are within radius_m of each other.
        Returns list of cluster groups (list of container ids).
        """
        from math import radians, cos, sin, asin, sqrt

        def haversine(c1, c2):
            """Great-circle distance in metres between two Container instances."""
            if not c1.location or not c2.location:
                return float("inf")
            lon1, lat1 = radians(c1.location.x), radians(c1.location.y)
            lon2, lat2 = radians(c2.location.x), radians(c2.location.y)
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            return 2 * 6_371_000 * asin(sqrt(a))

        visited = set()
        clusters = []
        for c in containers:
            if c.id in visited:
                continue
            cluster = [c.id]
            visited.add(c.id)
            for other in containers:
                if other.id not in visited and haversine(c, other) <= radius_m:
                    cluster.append(other.id)
                    visited.add(other.id)
            clusters.append(cluster)
        return clusters
