from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnnotationBase(BaseModel):
    content: str
    annotation_type: str = "note"  # note, comment, suggestion, etc.


class AnnotationCreate(AnnotationBase):
    quote_id: Optional[int] = None
    segment_id: Optional[int] = None
    document_id: Optional[int] = None
    code_id: Optional[int] = None
    project_id: Optional[int] = None  # Made optional since it can be derived


class AnnotationUpdate(BaseModel):
    content: Optional[str] = None
    annotation_type: Optional[str] = None


class AnnotationOut(AnnotationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quote_id: Optional[int] = None
    segment_id: Optional[int] = None
    document_id: Optional[int] = None
    code_id: Optional[int] = None
    project_id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime


class AnnotationWithDetails(AnnotationOut):
    quote_text: Optional[str] = None
    created_by_email: Optional[str] = None


class AnnotationFilter(BaseModel):
    project_id: Optional[int] = None
    quote_id: Optional[int] = None
    segment_id: Optional[int] = None
    document_id: Optional[int] = None
    code_id: Optional[int] = None
    created_by_id: Optional[int] = None
    annotation_type: Optional[str] = None
    search_text: Optional[str] = None


class AnnotationWithAllDetails(AnnotationOut):
    """Annotation with all related entity details for comprehensive project loading"""
    quote_text: Optional[str] = None
    segment_content: Optional[str] = None
    document_name: Optional[str] = None
    code_name: Optional[str] = None
    created_by_email: Optional[str] = None
