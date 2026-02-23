"""
Route model — represents an optimised waste collection route.

A Route links a driver to an ordered sequence of containers,
together with computed logistics metrics (distance, time, CO₂).
"""
from django.conf import settings
from django.db import models

from containers.models import Container
from users.models import User


class Route(models.Model):
    """
    An optimised waste collection route assigned to a driver.

    Fields
    ------
    driver          : The driver assigned to this route
    containers      : Ordered set of containers to visit (via RouteStop)
    total_distance  : Total route distance in kilometres
    estimated_time  : Estimated drive time in minutes
    estimated_co2   : Estimated CO₂ emissions in kg
    polyline        : Encoded Google polyline string for the route path
    created_at      : When the route was generated
    is_active       : Whether this is the current active route for the driver
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    driver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="routes",
        limit_choices_to={"role": "driver"},
    )
    containers = models.ManyToManyField(
        Container,
        through="RouteStop",
        related_name="routes",
        blank=True,
    )
    total_distance = models.FloatField(default=0.0, help_text="Total route distance in km.")
    estimated_time = models.FloatField(default=0.0, help_text="Estimated drive time in minutes.")
    estimated_co2 = models.FloatField(default=0.0, help_text="Estimated CO₂ emissions in kg.")
    polyline = models.TextField(blank=True, default="", help_text="Encoded Google polyline.")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Route"
        verbose_name_plural = "Routes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["driver", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Route #{self.pk} → Driver {self.driver.email} ({self.status})"


class RouteStop(models.Model):
    """
    Through model for Route ↔ Container with stop ordering.

    Fields
    ------
    route       : Parent route
    container   : Container to visit at this stop
    stop_order  : 0-indexed visit order in the route
    visited_at  : When the driver arrived at this container (optional)
    """

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    container = models.ForeignKey(Container, on_delete=models.CASCADE, related_name="route_stops")
    stop_order = models.PositiveSmallIntegerField()
    visited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["stop_order"]
        unique_together = [("route", "stop_order")]

    def __str__(self):
        return f"Route #{self.route.pk} Stop {self.stop_order} → Container #{self.container.pk}"
