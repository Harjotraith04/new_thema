from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class CodeBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"  # Default blue color


class CodeCreate(CodeBase):
    project_id: int
    parent_id: Optional[int] = None


class CodeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None


class CodeOut(CodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    parent_id: Optional[int] = None
    created_by_id: int
    created_at: datetime
    updated_at: datetime


class CodeWithHierarchy(CodeOut):
    children: List["CodeOut"] = []
    parent: Optional["CodeOut"] = None
    quotes_count: Optional[int] = None


class CodeFilter(BaseModel):
    project_id: Optional[int] = None
    parent_id: Optional[int] = None
    created_by_id: Optional[int] = None
    search_text: Optional[str] = None


class CodeWithQuotesAndSegments(CodeOut):
    """Code with its associated quotes and segments for comprehensive project loading"""
    quotes: List[Dict[str, Any]] = []  # QuoteOut data
    segments: List[Dict[str, Any]] = []  # DocumentSegmentOut data
    quotes_count: Optional[int] = None
    segments_count: Optional[int] = None
