from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.db.session import get_db
from app.core.auth import get_current_user
from app.services.ai_coding_service import AICodingService

router = APIRouter()


@router.post("/initial-coding", response_model=List[Dict[str, Any]])
def ai_initial_coding(
    document_ids: list[int],
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    return AICodingService.generate_code(
        document_ids=document_ids,
        db=db,
        user_id=current_user.id
    )
