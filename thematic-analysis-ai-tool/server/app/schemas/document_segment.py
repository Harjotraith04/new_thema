from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentSegmentBase(BaseModel):
    """Base schema for document segments"""
    segment_type: str  # "line", "sentence", "csv_row", etc.
    content: str
    line_number: Optional[int] = None
    page_number: Optional[int] = None
    paragraph_index: Optional[int] = None
    row_index: Optional[int] = None
    character_start: Optional[int] = None
    character_end: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None


class DocumentSegmentCreate(DocumentSegmentBase):
    """Schema for creating a new document segment"""
    document_id: int


class DocumentSegmentUpdate(BaseModel):
    """Schema for updating an existing document segment"""
    segment_type: Optional[str] = None
    content: Optional[str] = None
    line_number: Optional[int] = None
    page_number: Optional[int] = None
    paragraph_index: Optional[int] = None
    row_index: Optional[int] = None
    character_start: Optional[int] = None
    character_end: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None


class DocumentSegmentOut(DocumentSegmentBase):
    """Complete document segment output schema"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    created_at: datetime
    updated_at: datetime
    is_coded: bool = False
    code_names: List[str] = []


class DocumentSegmentWithCodes(DocumentSegmentOut):
    """Document segment with associated codes"""
    codes: List[Dict[str, Any]] = []


class DocumentSegmentWithQuotes(DocumentSegmentOut):
    """Document segment with associated quotes"""
    quotes: List[Dict[str, Any]] = []


class DocumentSegmentWithAll(DocumentSegmentOut):
    """Document segment with codes, quotes, and annotations"""
    codes: List[Dict[str, Any]] = []
    quotes: List[Dict[str, Any]] = []
    annotations: List[Dict[str, Any]] = []


# Bulk operations
class BulkSegmentCreate(BaseModel):
    """Schema for bulk creating document segments"""
    document_id: int
    segments: List[DocumentSegmentBase]


class BulkSegmentCodeAssignment(BaseModel):
    """Schema for bulk assigning codes to segments"""
    segment_ids: List[int]
    code_ids: List[int]
