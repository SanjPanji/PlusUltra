"""
Container model — represents a physical waste bin with a geographic location.
Uses PostGIS PointField for spatial queries.
"""
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _


class WasteType(models.TextChoices):
    GENERAL = "general", _("General Waste")
    RECYCLABLE = "recyclable", _("Recyclable")
    ORGANIC = "organic", _("Organic")
    HAZARDOUS = "hazardous", _("Hazardous")
    ELECTRONIC = "electronic", _("Electronic")


class Container(models.Model):
    """
    A physical waste container deployed at a geographic location.

    Fields
    ------
    location     : WGS-84 point (longitude, latitude) — PostGIS PointField
    fill_level   : Current fill percentage (0–100)
    waste_type   : Category of waste accepted
    last_updated : Timestamp of last fill-level reading
    is_active    : Whether the container is in service
    """

    location = gis_models.PointField(
        srid=4326,
        help_text="WGS-84 longitude/latitude point.",
    )
    fill_level = models.FloatField(
        default=0.0,
        help_text="Current fill level as percentage (0–100).",
    )
    waste_type = models.CharField(
        max_length=20,
        choices=WasteType.choices,
        default=WasteType.GENERAL,
    )
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    # Fill level history — simple JSON list of (timestamp, pct) pairs
    # used by Celery task to predict future fill rate
    fill_history = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Container"
        verbose_name_plural = "Containers"
        ordering = ["-fill_level"]
        indexes = [
            models.Index(fields=["fill_level"]),
            models.Index(fields=["waste_type"]),
        ]

    def __str__(self):
        return f"Container #{self.pk} ({self.waste_type}) — {self.fill_level:.1f}%"

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None

    @property
    def needs_collection(self):
        """True when fill_level exceeds the configured threshold."""
        from django.conf import settings
        return self.fill_level >= getattr(settings, "FILL_LEVEL_THRESHOLD", 70)
