from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class QuoteBase(BaseModel):
    text: str
    start_char: Optional[int] = None
    end_char: Optional[int] = None


class QuoteCreate(QuoteBase):
    segment_id: int
    document_id: Optional[int] = None  # Can be auto-filled from segment


class QuoteUpdate(BaseModel):
    text: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None


class QuoteOut(QuoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    segment_id: int
    document_id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime


class QuoteWithDetails(QuoteOut):
    """Quote with related information"""
    segment_content: Optional[str] = None
    document_name: Optional[str] = None
    created_by_email: Optional[str] = None


class QuoteFilter(BaseModel):
    """Filter options for quotes"""
    document_id: Optional[int] = None
    segment_id: Optional[int] = None
    created_by_id: Optional[int] = None
    search_text: Optional[str] = None


class QuoteWithCodesAndSegment(QuoteOut):
    """Quote with its associated codes and segment information for comprehensive project loading"""
    # Import types to avoid circular imports
    codes: List[Dict[str, Any]] = []  # Will contain CodeOut data
    segment_content: Optional[str] = None
    segment_type: Optional[str] = None
