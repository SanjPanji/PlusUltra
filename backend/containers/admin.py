"""
Django admin registrations for the containers app.
"""
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Container


@admin.register(Container)
class ContainerAdmin(GISModelAdmin):
    list_display = ["id", "waste_type", "fill_level", "is_active", "last_updated"]
    list_filter = ["waste_type", "is_active"]
    search_fields = ["id"]
    ordering = ["-fill_level"]
    readonly_fields = ["last_updated"]
    default_zoom = 12
