import time
import traceback
import uuid
from datetime import datetime, timezone

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.database import AsyncSessionLocal
from app.models.system_log import SystemLog

# Paths to skip logging (noisy health checks etc)
SKIP_PATHS = {"/health", "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in SKIP_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        request_id = str(uuid.uuid4())[:8]

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start) * 1000)

            level = "INFO"
            if response.status_code >= 500:
                level = "ERROR"
            elif response.status_code >= 400:
                level = "WARNING"

            await _write_log(
                level=level,
                category="http",
                message=f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)",
                detail={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.url.query) or None,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "client_ip": request.client.host if request.client else None,
                },
            )
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start) * 1000)
            tb = traceback.format_exc()

            await _write_log(
                level="ERROR",
                category="http",
                message=f"{request.method} {request.url.path} → UNHANDLED EXCEPTION: {type(exc).__name__}: {exc}",
                detail={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "exception_type": type(exc).__name__,
                    "exception_message": str(exc),
                    "traceback": tb,
                },
            )
            raise


async def _write_log(level: str, category: str, message: str, detail: dict | None = None) -> None:
    """Write a log entry using a fresh DB session — independent of the request session."""
    try:
        async with AsyncSessionLocal() as db:
            entry = SystemLog(
                id=uuid.uuid4(),
                level=level,
                category=category,
                message=message,
                detail=detail,
                created_at=datetime.now(timezone.utc),
            )
            db.add(entry)
            await db.commit()
    except Exception:
        # Never let logging break the request
        pass
