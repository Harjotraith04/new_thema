from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import PermissionChecker
from app.models.user import User
from app.schemas.quote import QuoteOut, QuoteCreate, QuoteUpdate, QuoteWithDetails
from app.services.quote_service import QuoteService

router = APIRouter()
# Maybe not needed


@router.post("/", response_model=QuoteOut)
def create_quote(
    quote: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new quote"""
    try:
        new_quote = QuoteService.create_quote(
            db=db,
            text=quote.text,
            segment_id=quote.segment_id,
            created_by_id=getattr(current_user, 'id'),
            start_char=quote.start_char,
            end_char=quote.end_char,
            document_id=quote.document_id
        )
        return new_quote
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))


@router.get("/document/{document_id}", response_model=List[QuoteOut])
def get_document_quotes(
    document_id: int,
    code_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quotes for a document"""
    quotes = QuoteService.get_quotes_by_document(
        db, document_id, getattr(current_user, 'id'), code_id
    )
    return quotes


@router.get("/project/{project_id}", response_model=List[QuoteWithDetails])
def get_project_quotes(
    project_id: int,
    code_id: Optional[int] = None,
    document_id: Optional[int] = None,
    created_by_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quotes for a project with filters"""

    # Check if user has access to project
    PermissionChecker.check_project_access(db, project_id, current_user)

    quotes = QuoteService.get_quotes_by_project_with_details(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id'),
        code_id=code_id,
        document_id=document_id,
        created_by_id=created_by_id
    )
    return quotes


@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific quote"""

    # Check if user has access to the quote (and its project)
    quote = PermissionChecker.check_quote_access(db, quote_id, current_user)
    return quote


@router.put("/{quote_id}", response_model=QuoteOut)
def update_quote(
    quote_id: int,
    quote_update: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a quote"""
    try:
        updated_quote = QuoteService.update_quote(
            db=db,
            quote_id=quote_id,
            user_id=getattr(current_user, 'id'),
            **quote_update.model_dump(exclude_unset=True)
        )
        return updated_quote
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{quote_id}")
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a quote"""
    try:
        QuoteService.delete_quote(
            db=db,
            quote_id=quote_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Quote deleted successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.post("/{quote_id}/codes/{code_id}")
def assign_code_to_quote(
    quote_id: int,
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign a code to a quote (many-to-many relationship)"""
    try:
        updated_quote = QuoteService.assign_code_to_quote(
            db=db,
            quote_id=quote_id,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Code assigned to quote successfully", "quote_id": quote_id, "code_id": code_id}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{quote_id}/codes/{code_id}")
def remove_code_from_quote(
    quote_id: int,
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a code from a quote (many-to-many relationship)"""
    try:
        _ = QuoteService.remove_code_from_quote(
            db=db,
            quote_id=quote_id,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Code removed from quote successfully", "quote_id": quote_id, "code_id": code_id}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/{quote_id}/codes", response_model=List[dict])
def get_quote_codes(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes assigned to a quote"""
    try:
        codes = QuoteService.get_quote_codes(
            db=db,
            quote_id=quote_id,
            user_id=getattr(current_user, 'id')
        )
        return [{"id": code.id, "name": code.name, "color": code.color} for code in codes]
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))
