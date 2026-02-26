from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.auth import router as auth_router
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

app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(subscriptions_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
