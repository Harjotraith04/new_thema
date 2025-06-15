from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.document_segment import (
    DocumentSegmentOut,
    DocumentSegmentCreate,
    DocumentSegmentUpdate,
    DocumentSegmentWithCodes,
    BulkSegmentCodeAssignment
)
from app.services.document_segment_service import DocumentSegmentService


router = APIRouter()


@router.get("/document/{document_id}", response_model=List[DocumentSegmentOut])
def get_document_segments(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all segments for a document"""
    return DocumentSegmentService.get_document_segments(document_id, db=db)


@router.get("/{segment_id}", response_model=DocumentSegmentWithCodes)
def get_segment(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific segment with its codes"""
    return DocumentSegmentService.get_segment(segment_id, db)


@router.post("/", response_model=DocumentSegmentOut)
def create_segment(
    segment: DocumentSegmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new document segment"""
    return DocumentSegmentService.create_segment(segment, db)


@router.put("/{segment_id}", response_model=DocumentSegmentOut)
def update_segment(
    segment_id: int,
    segment_update: DocumentSegmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a document segment"""
    return DocumentSegmentService.update_segment(segment_id, segment_update, db)


@router.post("/{segment_id}/codes", response_model=DocumentSegmentWithCodes)
def assign_codes_to_segment(
    segment_id: int,
    code_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign multiple codes to a segment"""
    return DocumentSegmentService.assign_codes_to_segment(segment_id, code_ids, db)


@router.delete("/{segment_id}/codes/{code_id}", status_code=200)
def remove_code_from_segment(
    segment_id: int,
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a code from a segment"""
    result = DocumentSegmentService.remove_code_from_segment(
        segment_id, code_id, db)
    return result


@router.delete("/{segment_id}", status_code=200)
def delete_segment(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document segment"""
    result = DocumentSegmentService.delete_segment(segment_id, db)
    return result
