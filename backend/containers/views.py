"""
Views for the containers app.

Endpoints
---------
GET   /containers/               — list containers
PATCH /containers/{id}/          — update fill_level
"""
import logging

from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminRole, IsAdminOrDriver
from .models import Container
from .serializers import ContainerSerializer, ContainerUpdateSerializer

logger = logging.getLogger(__name__)


class ContainerListView(generics.ListAPIView):
    """
    GET /containers/

    Admins see all active containers.
    Drivers see all containers (they need visibility for navigation).
    Supports filtering by waste_type and fill_level threshold.

    Query params:
        waste_type  : filter by waste type
        min_fill    : minimum fill level (default 0)
        needs_collection : 'true' to show only containers above threshold
    """

    serializer_class = ContainerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Container.objects.filter(is_active=True)

        waste_type = self.request.query_params.get("waste_type")
        if waste_type:
            qs = qs.filter(waste_type=waste_type)

        min_fill = self.request.query_params.get("min_fill")
        if min_fill is not None:
            try:
                qs = qs.filter(fill_level__gte=float(min_fill))
            except ValueError:
                pass

        needs_collection = self.request.query_params.get("needs_collection")
        if needs_collection == "true":
            threshold = getattr(settings, "FILL_LEVEL_THRESHOLD", 70)
            qs = qs.filter(fill_level__gte=threshold)

        return qs.order_by("-fill_level")


class ContainerDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    GET   /containers/{id}/  — retrieve single container
    PATCH /containers/{id}/  — update fill_level (drivers) or any field (admin)

    Drivers may only update fill_level.
    Admins may update all fields.
    """

    queryset = Container.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH") and self.request.user.role == "driver":
            return ContainerUpdateSerializer
        return ContainerSerializer

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        container = serializer.save()

        # Append fill level to history for prediction
        from django.utils import timezone
        history_entry = {
            "timestamp": timezone.now().isoformat(),
            "fill_level": container.fill_level,
        }
        history = container.fill_history or []
        history.append(history_entry)
        # Keep last 100 readings
        container.fill_history = history[-100:]
        container.save(update_fields=["fill_history"])

        logger.info("Container #%d fill_level updated to %.1f%%", container.pk, container.fill_level)
        return Response(ContainerSerializer(container).data)
