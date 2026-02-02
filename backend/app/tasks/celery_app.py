"""
Celery application configuration.

Provides:
- Celery app instance with Redis broker
- Task routing configuration
- Beat schedule for periodic tasks
- Retry and rate limiting configuration
"""
from celery import Celery
from celery.schedules import crontab
from kombu import Queue, Exchange

from app.config import get_settings

settings = get_settings()

# Create Celery app
celery_app = Celery(
    "erp_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    # Task serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone=settings.APP_TIMEZONE,
    enable_utc=False,

    # Task execution settings
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,  # Reject tasks if worker dies
    worker_prefetch_multiplier=1,  # Process one task at a time per worker

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store additional task metadata

    # Task routing
    task_default_queue="default",
    task_queues=(
        Queue("default", Exchange("default"), routing_key="default"),
        Queue("shopify", Exchange("shopify"), routing_key="shopify.#"),
        Queue("shopify_high", Exchange("shopify_high"), routing_key="shopify_high.#"),
        Queue("shopify_low", Exchange("shopify_low"), routing_key="shopify_low.#"),
        Queue("email", Exchange("email"), routing_key="email.#"),
        Queue("email_low", Exchange("email_low"), routing_key="email_low.#"),
    ),
    task_routes={
        "app.tasks.shopify_tasks.sync_orders": {"queue": "shopify"},
        "app.tasks.shopify_tasks.sync_products": {"queue": "shopify"},
        "app.tasks.shopify_tasks.sync_inventory": {"queue": "shopify"},
        "app.tasks.shopify_tasks.sync_customers": {"queue": "shopify"},
        "app.tasks.shopify_tasks.process_order_webhook": {"queue": "shopify_high"},
        "app.tasks.shopify_tasks.process_product_webhook": {"queue": "shopify"},
        "app.tasks.shopify_tasks.process_inventory_webhook": {"queue": "shopify"},
        "app.tasks.shopify_tasks.process_customer_webhook": {"queue": "shopify"},
        "app.tasks.shopify_tasks.full_sync": {"queue": "shopify_low"},
        # Email tasks
        "app.tasks.email_tasks.send_daily_invoices_task": {"queue": "email_low"},
        "app.tasks.email_tasks.send_invoice_email_task": {"queue": "email"},
        "app.tasks.email_tasks.send_overdue_reminders_task": {"queue": "email_low"},
        "app.tasks.email_tasks.email_health_check": {"queue": "email"},
    },

    # Retry settings
    task_default_retry_delay=60,  # 1 minute default retry delay
    task_max_retries=3,

    # Rate limiting (Shopify API has rate limits)
    task_annotations={
        "app.tasks.shopify_tasks.*": {
            "rate_limit": "2/s",  # 2 requests per second for Shopify
        },
        "app.tasks.shopify_tasks.full_sync": {
            "rate_limit": "1/m",  # 1 full sync per minute max
        },
        # Email rate limits to avoid being flagged as spam
        "app.tasks.email_tasks.send_daily_invoices_task": {
            "rate_limit": "1/m",  # 1 daily invoice batch per minute max
        },
        "app.tasks.email_tasks.send_invoice_email_task": {
            "rate_limit": "10/m",  # 10 individual emails per minute max
        },
        "app.tasks.email_tasks.send_overdue_reminders_task": {
            "rate_limit": "1/m",  # 1 overdue reminder batch per minute max
        },
    },

    # Beat schedule for periodic tasks
    beat_schedule={
        "sync-shopify-orders-every-5-minutes": {
            "task": "app.tasks.shopify_tasks.sync_orders",
            "schedule": 300.0,  # 5 minutes
            "options": {"queue": "shopify"},
        },
        "sync-shopify-products-every-15-minutes": {
            "task": "app.tasks.shopify_tasks.sync_products",
            "schedule": 900.0,  # 15 minutes
            "options": {"queue": "shopify"},
        },
        "sync-shopify-inventory-every-10-minutes": {
            "task": "app.tasks.shopify_tasks.sync_inventory",
            "schedule": 600.0,  # 10 minutes
            "options": {"queue": "shopify"},
        },
        "sync-shopify-customers-every-30-minutes": {
            "task": "app.tasks.shopify_tasks.sync_customers",
            "schedule": 1800.0,  # 30 minutes
            "options": {"queue": "shopify"},
        },
        "full-shopify-sync-daily": {
            "task": "app.tasks.shopify_tasks.full_sync",
            "schedule": 86400.0,  # 24 hours
            "options": {"queue": "shopify_low"},
        },
        # Email tasks - Daily invoice summary at 21:00 Europe/Paris timezone
        "send-daily-invoices-every-day": {
            "task": "app.tasks.email_tasks.send_daily_invoices_task",
            "schedule": crontab(hour=21, minute=0),
            "options": {
                "queue": "email_low",
                "expires": 3600,  # Task expires after 1 hour if not executed
            },
        },
        # Overdue reminders - Every day at 9:00 AM local time
        "send-overdue-reminders-daily": {
            "task": "app.tasks.email_tasks.send_overdue_reminders_task",
            "schedule": crontab(hour=9, minute=0),
            "options": {"queue": "email_low"},
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])
