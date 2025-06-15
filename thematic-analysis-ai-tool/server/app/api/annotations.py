from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.annotation import AnnotationOut, AnnotationCreate, AnnotationUpdate, AnnotationWithDetails
from app.services.annotation_service import AnnotationService

router = APIRouter()
# Maybe not needed

@router.post("/", response_model=AnnotationOut)
def create_annotation(
    annotation: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new annotation"""
    try:
        db_annotation = AnnotationService.create_annotation(
            db=db,
            content=annotation.content,
            annotation_type=annotation.annotation_type,
            user_id=getattr(current_user, 'id'),
            quote_id=annotation.quote_id,
            segment_id=annotation.segment_id,
            document_id=annotation.document_id,
            code_id=annotation.code_id
        )
        return db_annotation
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/quote/{quote_id}", response_model=List[AnnotationOut])
def get_quote_annotations(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a quote"""
    annotations = AnnotationService.get_quote_annotations(
        db=db,
        quote_id=quote_id,
        user_id=getattr(current_user, 'id')
    )
    return annotations


@router.get("/segment/{segment_id}", response_model=List[AnnotationOut])
def get_segment_annotations(
    segment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a segment"""
    annotations = AnnotationService.get_segment_annotations(
        db=db,
        segment_id=segment_id,
        user_id=getattr(current_user, 'id')
    )
    return annotations


@router.get("/project/{project_id}", response_model=List[AnnotationWithDetails])
def get_project_annotations(
    project_id: int,
    annotation_type: Optional[str] = None,
    created_by_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a project with filtering options"""
    annotations = AnnotationService.get_project_annotations(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id'),
        annotation_type=annotation_type,
        created_by_id=created_by_id
    )
    return annotations


@router.get("/{annotation_id}", response_model=AnnotationOut)
def get_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific annotation"""
    annotation = AnnotationService.get_annotation(
        db=db,
        annotation_id=annotation_id,
        user_id=getattr(current_user, 'id')
    )
    if not annotation:
        raise HTTPException(
            status_code=404, detail="Annotation not found or access denied")
    return annotation


@router.put("/{annotation_id}", response_model=AnnotationOut)
def update_annotation(
    annotation_id: int,
    annotation_update: AnnotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an annotation"""
    try:
        updated_annotation = AnnotationService.update_annotation(
            db=db,
            annotation_id=annotation_id,
            user_id=getattr(current_user, 'id'),
            **annotation_update.model_dump(exclude_unset=True)
        )
        return updated_annotation
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{annotation_id}")
def delete_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an annotation"""
    try:
        AnnotationService.delete_annotation(
            db=db,
            annotation_id=annotation_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Annotation deleted successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))
