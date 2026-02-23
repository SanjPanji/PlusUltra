"""
Celery application configuration for PlusUltra.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("plusultra")  # type: ignore

# Load config from Django settings, using CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ---------------------------------------------------------------------------
# Periodic task schedule (Celery Beat)
# ---------------------------------------------------------------------------
app.conf.beat_schedule = {
    # Recalculate all routes every hour
    "recalculate-routes-hourly": {
        "task": "routes.tasks.recalculate_all_routes",
        "schedule": crontab(minute=0),  # every hour at :00
    },
    # Predict fill levels every 30 minutes
    "predict-fill-levels": {
        "task": "containers.tasks.predict_fill_levels",
        "schedule": crontab(minute="*/30"),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
