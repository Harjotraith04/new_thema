from pydantic import BaseModel, ConfigDict
from typing import List, Optional, TYPE_CHECKING, Dict, Any
from datetime import datetime
from app.schemas.user import UserOut
from app.schemas.document import DocumentOut
from app.schemas.code import CodeOut
from app.schemas.quote import QuoteOut
from app.schemas.annotation import AnnotationOut

if TYPE_CHECKING:
    from app.schemas.code import CodeWithQuotesAndSegments
    from app.schemas.quote import QuoteWithCodesAndSegment
    from app.schemas.annotation import AnnotationWithAllDetails


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int

    documents: Optional[List[DocumentOut]] = None
    codes: Optional[List[CodeOut]] = None
    quotes: Optional[List[QuoteOut]] = None
    annotations: Optional[List[AnnotationOut]] = None

    created_at: datetime
    updated_at: datetime


class ProjectWithDetails(ProjectOut):
    owner: UserOut
    collaborators: List[UserOut] = []


class ProjectSummary(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectComprehensive(ProjectBase):
    """Comprehensive project schema that loads all related data at once"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    documents: List[Dict[str, Any]] = []  # DocumentWithSegments data
    codes: List[Dict[str, Any]] = []      # CodeWithQuotesAndSegments data
    quotes: List[Dict[str, Any]] = []     # QuoteWithCodesAndSegment data
    annotations: List[Dict[str, Any]] = []  # AnnotationWithAllDetails data