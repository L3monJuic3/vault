from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.import_record import Import
from app.models.user import User
from app.schemas.import_record import ImportRead
from app.services.import_service import process_import

router = APIRouter(prefix="/api/v1/imports", tags=["imports"])


@router.post("/upload", response_model=ImportRead, status_code=status.HTTP_201_CREATED)
async def upload_statement(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Upload a bank statement CSV.
    Auto-detects format (Amex, HSBC), deduplicates, saves transactions,
    and triggers AI categorisation + subscription detection.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Read content
    raw = await file.read()
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        content = raw.decode("latin-1")  # fallback for older bank exports

    # Process
    try:
        import_record, transaction_ids = await process_import(
            db,
            user_id=user.id,
            filename=file.filename,
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Fire Celery tasks if transactions were imported
    if transaction_ids:
        try:
            from app.tasks.categorise_task import categorise_transactions_task
            from app.tasks.detect_subscriptions_task import detect_subscriptions_task

            categorise_transactions_task.delay(str(user.id), transaction_ids)
            detect_subscriptions_task.delay(str(user.id))
        except Exception:
            # Tasks are best-effort — don't fail the upload if Celery is down
            pass

    return ImportRead.model_validate(import_record)


@router.get("", response_model=list[ImportRead])
async def list_imports(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all imports for the current user, newest first."""
    result = await db.execute(
        select(Import)
        .where(Import.user_id == user.id)
        .order_by(desc(Import.created_at))
    )
    return [ImportRead.model_validate(r) for r in result.scalars().all()]


@router.get("/{import_id}", response_model=ImportRead)
async def get_import(
    import_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a single import record."""
    record = await db.get(Import, import_id)
    if record is None or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="Import not found")
    return ImportRead.model_validate(record)
