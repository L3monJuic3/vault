from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.logging import RequestLoggingMiddleware
from app.routes.accounts import router as accounts_router
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.debug import router as debug_router
from app.routes.imports import router as imports_router
from app.routes.subscriptions import router as subscriptions_router
from app.routes.transactions import router as transactions_router

app = FastAPI(title="Vault API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging — must be added after CORS
app.add_middleware(RequestLoggingMiddleware)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(analytics_router)
app.include_router(categories_router)
app.include_router(debug_router)
app.include_router(imports_router)
app.include_router(transactions_router)
app.include_router(subscriptions_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
