"""
Serializers for the routes app.
"""
from rest_framework import serializers

from users.serializers import UserSerializer
from containers.serializers import ContainerSerializer
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    """Inline stop with container details."""

    container = ContainerSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = ["stop_order", "container", "visited_at"]


class RouteSerializer(serializers.ModelSerializer):
    """Full route representation with ordered stops."""

    driver = UserSerializer(read_only=True)
    stops = RouteStopSerializer(many=True, read_only=True)
    container_count = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            "id",
            "driver",
            "stops",
            "container_count",
            "total_distance",
            "estimated_time",
            "estimated_co2",
            "polyline",
            "status",
            "created_at",
            "is_active",
        ]
        read_only_fields = [
            "total_distance", "estimated_time", "estimated_co2",
            "polyline", "created_at",
        ]

    def get_container_count(self, obj):
        return obj.stops.count()


class RouteSummarySerializer(serializers.ModelSerializer):
    """Lightweight route summary for list views."""

    driver_email = serializers.EmailField(source="driver.email", read_only=True)
    container_count = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            "id",
            "driver_email",
            "container_count",
            "total_distance",
            "estimated_time",
            "estimated_co2",
            "status",
            "created_at",
        ]

    def get_container_count(self, obj):
        return obj.stops.count()


class RecalculateRouteSerializer(serializers.Serializer):
    """
    Input serializer for POST /routes/recalculate/.

    Fields
    ------
    driver_id       : ID of the driver for whom the route is being calculated
    depot_longitude : X coordinate of the depot/garage start
    depot_latitude  : Y coordinate of the depot/garage start
    threshold       : Override the fill_level threshold (optional)
    """

    driver_id = serializers.IntegerField()
    depot_longitude = serializers.FloatField(min_value=-180, max_value=180)
    depot_latitude = serializers.FloatField(min_value=-90, max_value=90)
    threshold = serializers.FloatField(
        min_value=0, max_value=100, required=False, default=None,
        allow_null=True,
    )

    def validate_driver_id(self, value):
        from users.models import User
        try:
            user = User.objects.get(pk=value, role="driver", is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"No active driver with id={value}.")
        self.driver_instance = user
        return value
