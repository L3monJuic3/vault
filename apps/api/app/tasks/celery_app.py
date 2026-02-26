from celery import Celery

from app.config import settings

celery_app = Celery(
    "vault",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
    task_max_retries=3,
)


@celery_app.task(bind=True)
def health_check_task(self):
    return {"status": "ok", "task_id": self.request.id}
