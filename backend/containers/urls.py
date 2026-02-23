"""
URL configuration for the containers app.
"""
from django.urls import path

from .views import ContainerDetailUpdateView, ContainerListView

app_name = "containers"

urlpatterns = [
    path("", ContainerListView.as_view(), name="container_list"),
    path("<int:pk>/", ContainerDetailUpdateView.as_view(), name="container_detail"),
]
