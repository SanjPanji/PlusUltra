"""
Celery background task: fill level prediction.

Uses a simple linear regression on each container's fill_history to
predict when it will reach the collection threshold, and pre-emptively
flags containers for inclusion in the next route.
"""
import logging
from datetime import datetime, timezone as dt_timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def predict_fill_levels(self):
    """
    Runs every 30 minutes (configured in config/celery.py beat schedule).

    For each active container:
      1. Reads fill_history (list of {timestamp, fill_level})
      2. Fits a linear trend (fill increase per hour)
      3. Projects fill level 2 hours ahead
      4. If projected fill >= threshold, marks the container for collection

    The task does NOT update fill_level directly — it only logs predictions.
    Actual fill-level updates come from IoT sensor PATCH calls.
    """
    from django.conf import settings
    from containers.models import Container

    threshold = getattr(settings, "FILL_LEVEL_THRESHOLD", 70)
    containers = Container.objects.filter(is_active=True).only("id", "fill_level", "fill_history")

    predictions = []
    for container in containers:
        history = container.fill_history or []
        if len(history) < 2:
            continue

        try:
            rate = _compute_fill_rate(history)  # % per hour
            projected = container.fill_level + rate * 2  # 2-hour projection
            projected = min(projected, 100.0)

            if projected >= threshold and container.fill_level < threshold:
                logger.info(
                    "Container #%d predicted to reach threshold in <2h "
                    "(current: %.1f%%, projected: %.1f%%, rate: %.2f%%/h)",
                    container.id, container.fill_level, projected, rate,
                )
            predictions.append({
                "container_id": container.id,
                "current_fill": container.fill_level,
                "projected_fill_2h": round(projected, 2),
                "fill_rate_per_hour": round(rate, 4),
                "will_need_collection": projected >= threshold,
            })
        except Exception as exc:
            logger.warning("Prediction failed for container #%d: %s", container.id, exc)

    logger.info("Fill level prediction complete. Processed %d containers.", len(predictions))
    return {"processed": len(predictions), "predictions": predictions}


def _compute_fill_rate(history):
    """
    Compute average fill increase rate (% per hour) from fill_history.
    history: list of dicts with 'timestamp' (ISO string) and 'fill_level' (float).
    """
    if len(history) < 2:
        return 0.0

    # Parse and sort by time
    parsed = []
    for entry in history:
        try:
            ts = datetime.fromisoformat(entry["timestamp"])
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=dt_timezone.utc)
            parsed.append((ts.timestamp(), float(entry["fill_level"])))
        except (KeyError, ValueError):
            continue

    if len(parsed) < 2:
        return 0.0

    parsed.sort(key=lambda x: x[0])

    # Simple least-squares linear regression: fill = m * t + b
    n = len(parsed)
    t_vals = [p[0] for p in parsed]
    f_vals = [p[1] for p in parsed]
    t_mean = sum(t_vals) / n
    f_mean = sum(f_vals) / n

    numerator = sum((t - t_mean) * (f - f_mean) for t, f in zip(t_vals, f_vals))
    denominator = sum((t - t_mean) ** 2 for t in t_vals)

    if denominator == 0:
        return 0.0

    m = numerator / denominator  # % per second
    return m * 3600  # convert to % per hour
