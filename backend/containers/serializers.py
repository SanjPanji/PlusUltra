"""
Serializers for the containers app.

Includes:
  - ContainerSerializer       : standard DRF
  - ContainerGeoSerializer    : GeoJSON FeatureCollection (rest_framework_gis)
  - ContainerUpdateSerializer : restricted PATCH (fill_level only)
  - HotspotSerializer         : lightweight hotspot summary
"""
from django.conf import settings
from rest_framework import serializers

from .models import Container


class ContainerSerializer(serializers.ModelSerializer):
    """Full container representation with lat/lon helpers."""

    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)
    needs_collection = serializers.BooleanField(read_only=True)

    class Meta:
        model = Container
        fields = [
            "id",
            "latitude",
            "longitude",
            "fill_level",
            "waste_type",
            "last_updated",
            "is_active",
            "needs_collection",
        ]
        read_only_fields = ["last_updated"]


class ContainerUpdateSerializer(serializers.ModelSerializer):
    """Drivers can only update the fill_level field via PATCH."""

    class Meta:
        model = Container
        fields = ["fill_level"]

    def validate_fill_level(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("fill_level must be between 0 and 100.")
        return value


class ContainerGeoSerializer(serializers.ModelSerializer):
    """
    GeoJSON Feature serializer — output format:
    {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [lon, lat] },
        "properties": { "id": ..., "fill_level": ..., ... }
    }
    """

    geometry = serializers.SerializerMethodField()
    properties = serializers.SerializerMethodField()

    class Meta:
        model = Container
        fields = ["geometry", "properties"]

    def get_geometry(self, obj):
        if obj.location:
            return {
                "type": "Point",
                "coordinates": [obj.location.x, obj.location.y],
            }
        return None

    def get_properties(self, obj):
        return {
            "id": obj.id,
            "fill_level": obj.fill_level,
            "waste_type": obj.waste_type,
            "last_updated": obj.last_updated.isoformat() if obj.last_updated else None,
            "is_active": obj.is_active,
            "needs_collection": obj.needs_collection,
        }


class HotspotSerializer(serializers.ModelSerializer):
    """Minimal container data for hotspot map overlay."""

    latitude = serializers.FloatField(read_only=True)
    longitude = serializers.FloatField(read_only=True)
    severity = serializers.SerializerMethodField()

    class Meta:
        model = Container
        fields = ["id", "latitude", "longitude", "fill_level", "waste_type", "severity"]

    def get_severity(self, obj):
        """Map fill_level to low/medium/high/critical."""
        if obj.fill_level >= 90:
            return "critical"
        if obj.fill_level >= 75:
            return "high"
        if obj.fill_level >= 50:
            return "medium"
        return "low"
