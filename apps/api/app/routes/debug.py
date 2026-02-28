import asyncio
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.middleware.auth import get_current_user
from app.services.log_service import get_logs, get_log_counts, write_log


async def require_debug_mode() -> None:
    """Block all debug routes when running in production."""
    if settings.app_env == "production":
        raise HTTPException(status_code=404, detail="Not Found")


router = APIRouter(
    prefix="/api/v1/debug",
    tags=["debug"],
    dependencies=[Depends(require_debug_mode), Depends(get_current_user)],
)


@router.get("/health")
async def detailed_health(db: AsyncSession = Depends(get_db)):
    """
    Detailed health check — tests every service connection and returns
    status, latency, and error details for each.
    """
    services = {}

    # ── Database ─────────────────────────────────────────────────────
    t = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        services["database"] = {
            "status": "ok",
            "latency_ms": round((time.perf_counter() - t) * 1000),
        }
    except Exception as exc:
        services["database"] = {
            "status": "error",
            "latency_ms": round((time.perf_counter() - t) * 1000),
            "error": str(exc),
        }

    # ── Redis ─────────────────────────────────────────────────────────
    t = time.perf_counter()
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.redis_url, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
        services["redis"] = {
            "status": "ok",
            "latency_ms": round((time.perf_counter() - t) * 1000),
        }
    except Exception as exc:
        services["redis"] = {
            "status": "error",
            "latency_ms": round((time.perf_counter() - t) * 1000),
            "error": str(exc),
        }

    # ── Celery Worker ─────────────────────────────────────────────────
    t = time.perf_counter()
    try:
        from app.tasks.celery_app import celery_app

        inspect = celery_app.control.inspect(timeout=2)
        active = await asyncio.to_thread(inspect.ping)
        if active:
            worker_count = len(active)
            services["celery"] = {
                "status": "ok",
                "latency_ms": round((time.perf_counter() - t) * 1000),
                "workers": worker_count,
            }
        else:
            services["celery"] = {
                "status": "warning",
                "latency_ms": round((time.perf_counter() - t) * 1000),
                "error": "No workers responded — tasks will queue but not process",
            }
    except Exception as exc:
        services["celery"] = {
            "status": "error",
            "latency_ms": round((time.perf_counter() - t) * 1000),
            "error": str(exc),
        }

    # ── AI (Anthropic key present?) ───────────────────────────────────
    services["ai"] = {
        "status": "ok" if settings.anthropic_api_key else "warning",
        "error": None
        if settings.anthropic_api_key
        else "ANTHROPIC_API_KEY not set — AI features disabled",
    }

    # ── Overall status ────────────────────────────────────────────────
    statuses = [s["status"] for s in services.values()]
    if "error" in statuses:
        overall = "degraded"
    elif "warning" in statuses:
        overall = "warning"
    else:
        overall = "ok"

    return {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.app_env,
        "services": services,
    }


@router.post("/run-subscription-detection")
async def run_subscription_detection(
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger subscription detection for the default user.

    Useful after migration fixes or when the Celery task failed silently.
    Runs synchronously (not via Celery) so you get immediate feedback.
    """
    from sqlalchemy import select as _select

    from app.ai.subscription_detector import detect_subscriptions
    from app.models.account import Account
    from app.models.transaction import Transaction
    from app.models.user import User

    # Grab first user (single-user V1)
    user_result = await db.execute(_select(User).limit(1))
    user = user_result.scalar_one_or_none()
    if user is None:
        return {"error": "No users found"}

    # Fetch all transactions
    result = await db.execute(
        _select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user.id)
        .order_by(Transaction.date.desc())
    )
    transactions = list(result.scalars().all())

    # Run detection
    groups = await detect_subscriptions(db, user.id, transactions)  # type: ignore[arg-type]
    await db.commit()

    return {
        "user_id": str(user.id),
        "transactions_analysed": len(transactions),
        "subscriptions_created": len(groups),
        "groups": [
            {
                "name": g.name,
                "type": g.type,
                "frequency": g.frequency,
                "estimated_amount": float(g.estimated_amount),
                "status": g.status,
            }
            for g in groups
        ],
    }


@router.get("/logs")
async def get_system_logs(
    level: str | None = Query(
        None, description="Filter by level: DEBUG INFO WARNING ERROR CRITICAL"
    ),
    category: str | None = Query(
        None, description="Filter by category: http parse ai auth system task"
    ),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve structured log entries, newest first."""
    logs = await get_logs(
        db, level=level, category=category, limit=limit, offset=offset
    )
    counts = await get_log_counts(db)

    return {
        "logs": [
            {
                "id": str(log.id),
                "level": log.level,
                "category": log.category,
                "message": log.message,
                "detail": log.detail,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "counts": counts,
        "total": sum(counts.values()),
    }


@router.delete("/logs")
async def clear_logs(db: AsyncSession = Depends(get_db)):
    """Clear all log entries. Useful during development."""
    await db.execute(text("DELETE FROM system_logs"))
    await db.commit()
    return {"cleared": True}


@router.post("/logs/test")
async def write_test_log(db: AsyncSession = Depends(get_db)):
    """Write a test log entry to verify the logging pipeline is working."""
    await write_log(
        db,
        level="INFO",
        category="system",
        message="Debug test log entry written successfully",
        detail={
            "source": "debug endpoint",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    return {"ok": True, "message": "Test log written"}
