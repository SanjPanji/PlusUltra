"""
PlusUltra package — make Celery app available for Django's manage.py.
"""
from .celery import app as celery_app

__all__ = ("celery_app",)
