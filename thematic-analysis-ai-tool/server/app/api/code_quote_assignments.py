from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.code_assignment_service import (
    CodeAssignmentService,
    SmartQuoteCodeAssignment,
    SmartSegmentCodeAssignment,
    SmartAnnotationCreation
)

router = APIRouter()

# Needed
@router.post("/quote-code-assignment", response_model=Dict[str, Any])
def assign_code_to_quote(
    request: SmartQuoteCodeAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeAssignmentService.smart_quote_code_assignment(
            db=db,
            request=request,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        if "not found" in str(e).lower() or "access denied" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Code assignment failed: {str(e)}")

# Needed
@router.post("/segment-code-assignment", response_model=Dict[str, Any])
def assign_code_to_segment(
    request: SmartSegmentCodeAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeAssignmentService.smart_segment_code_assignment(
            db=db,
            request=request,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        if "not found" in str(e).lower() or "access denied" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Code assignment failed: {str(e)}")

# Needed
@router.post("/annotation-with-quote", response_model=Dict[str, Any])
def create_annotation_with_quote(
    request: SmartAnnotationCreation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeAssignmentService.smart_annotation_creation(
            db=db,
            request=request,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        if "not found" in str(e).lower() or "access denied" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Annotation creation failed: {str(e)}")