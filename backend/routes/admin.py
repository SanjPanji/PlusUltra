"""
Django admin for the routes app.
"""
from django.contrib import admin

from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    fields = ["stop_order", "container", "visited_at"]
    readonly_fields = ["visited_at"]
    ordering = ["stop_order"]


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = [
        "id", "driver", "status", "is_active",
        "total_distance", "estimated_time", "estimated_co2", "created_at",
    ]
    list_filter = ["status", "is_active", "driver"]
    search_fields = ["driver__email"]
    readonly_fields = ["created_at", "polyline"]
    ordering = ["-created_at"]
    inlines = [RouteStopInline]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ["route", "stop_order", "container", "visited_at"]
    list_filter = ["route"]
    ordering = ["route", "stop_order"]
