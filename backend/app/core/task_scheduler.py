"""
Task Scheduler Configuration

Configures background task scheduling using APScheduler.
Can be replaced with Celery for distributed task processing.
"""

import logging
from typing import Optional
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.tasks.landed_cost_tasks import (
    run_scheduled_cost_update,
    run_cleanup
)

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """Get or create the scheduler instance."""
    global scheduler
    if scheduler is None:
        scheduler = AsyncIOScheduler()
    return scheduler


def configure_landed_cost_tasks(sched: AsyncIOScheduler):
    """Configure landed cost related scheduled tasks."""
    
    # Daily cost update check at 2 AM
    sched.add_job(
        run_scheduled_cost_update,
        trigger=CronTrigger(hour=2, minute=0),
        id="landed_cost_daily_update",
        name="Daily Landed Cost Update",
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    
    # Weekly cleanup on Sundays at 3 AM
    sched.add_job(
        run_cleanup,
        trigger=CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="landed_cost_weekly_cleanup",
        name="Weekly Landed Cost Cleanup",
        replace_existing=True,
        kwargs={"days_old": 365}
    )
    
    logger.info("Landed cost tasks configured")


def start_scheduler():
    """Start the background task scheduler."""
    sched = get_scheduler()
    
    # Configure all task groups
    configure_landed_cost_tasks(sched)
    
    # Start the scheduler
    if not sched.running:
        sched.start()
        logger.info("Task scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Task scheduler shutdown complete")
        scheduler = None


def add_one_time_task(func, run_date: datetime, **kwargs):
    """Add a one-time task to run at a specific time."""
    sched = get_scheduler()
    return sched.add_job(
        func,
        trigger="date",
        run_date=run_date,
        **kwargs
    )


def add_interval_task(func, seconds: int, **kwargs):
    """Add a task to run at regular intervals."""
    sched = get_scheduler()
    return sched.add_job(
        func,
        trigger=IntervalTrigger(seconds=seconds),
        **kwargs
    )
