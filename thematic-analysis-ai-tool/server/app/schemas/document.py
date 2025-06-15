from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List, Union, Literal
from datetime import datetime
from app.models.document import DocumentType
from app.schemas.document_segment import DocumentSegmentBase, DocumentSegmentOut


# Content structure schemas for thematic analysis


class DocumentContent(BaseModel):
    """Schema for structured document content with segments"""
    segments: List[DocumentSegmentOut]
    total_segments: int
    segmentation_type: Literal["line", "line_by_page", "sentence", "csv_row", "unknown"] = "unknown"
    columns: Optional[List[str]] = None  # For CSV files
    error: Optional[str] = None  # For error cases


class DocumentBase(BaseModel):
    """Base document schema with required fields"""
    name: str
    description: Optional[str] = None
    document_type: DocumentType


class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    project_id: int


class DocumentUpdate(BaseModel):
    """Schema for updating an existing document"""
    name: Optional[str] = None
    description: Optional[str] = None


class DocumentOut(DocumentBase):
    """Complete document output schema"""
    model_config = ConfigDict(from_attributes=True)

    # Required fields
    id: int
    project_id: int
    uploaded_by_id: int
    created_at: datetime
    updated_at: datetime
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    raw_content_url: Optional[str] = None
    content: Optional[DocumentContent] = None
    # raw_content: Optional[str] = None
    file_metadata: Optional[Dict[str, Any]] = None
    processed_at: Optional[datetime] = None


class DocumentUpload(BaseModel):
    """Response schema for file uploads"""
    id: int
    name: str
    cloudinary_url: Optional[str] = None
    content: Optional[DocumentContent] = None
    # raw_content: Optional[str] = None
    file_size: Optional[int] = None
    upload_status: str = "success"


class BulkUploadResult(BaseModel):
    """Response schema for bulk file uploads"""
    uploaded_documents: List[DocumentUpload]
    failed_uploads: List[Dict[str, Any]]
    total_files: int
    total_uploaded: int
    total_errors: int