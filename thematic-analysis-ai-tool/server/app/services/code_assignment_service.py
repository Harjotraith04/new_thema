from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.models.quote import Quote
from app.models.code import Code
from app.models.annotation import Annotation, AnnotationType
from app.models.document_segment import DocumentSegment
from app.models.user import User
from app.models.document import Document
from app.services.quote_service import QuoteService
from app.services.code_service import CodeService
from app.services.annotation_service import AnnotationService
from app.core.permissions import PermissionChecker


class SmartQuoteCodeAssignment(BaseModel):
    """Request model for smart quote + code assignment"""
    document_id: int
    segment_id: int
    text: str
    start_char: int
    end_char: int
    code_name: str
    code_description: Optional[str] = None
    code_color: Optional[str] = "#3B82F6"


class SmartSegmentCodeAssignment(BaseModel):
    """Request model for smart segment + code assignment"""
    segment_id: int
    code_name: str
    code_description: Optional[str] = None
    code_color: Optional[str] = "#3B82F6"


class SmartAnnotationCreation(BaseModel):
    """Request model for smart annotation creation"""
    content: str
    annotation_type: AnnotationType
    # Target can be quote (with auto-creation) or direct segment/document/code
    document_id: Optional[int] = None
    segment_id: Optional[int] = None
    quote_text: Optional[str] = None
    quote_start_char: Optional[int] = None
    quote_end_char: Optional[int] = None
    code_id: Optional[int] = None
    project_id: int


class CodeAssignmentService:
    """Service for intelligent code assignment workflows"""

    @staticmethod
    def find_or_create_quote(
        db: Session,
        document_id: int,
        segment_id: int,
        text: str,
        start_char: int,
        end_char: int,
        user_id: int
    ) -> Quote:
        """Find existing quote or create new one for the same text range"""

        # Look for existing quotes with exact same text range in the same segment
        existing_quotes = QuoteService.get_overlapping_quotes(
            db, segment_id, start_char, end_char
        )

        # Check if any existing quote has exact same range and text
        for quote in existing_quotes:
            if (quote.start_char == start_char and
                quote.end_char == end_char and
                    quote.text.strip() == text.strip()):
                return quote

        # No exact match found, create new quote
        return QuoteService.create_quote(
            db=db,
            text=text,
            segment_id=segment_id,
            created_by_id=user_id,
            start_char=start_char,
            end_char=end_char,
            document_id=document_id
        )

    @staticmethod
    def find_or_create_code(
        db: Session,
        project_id: int,
        code_name: str,
        user_id: int,
        description: Optional[str] = None,
        color: Optional[str] = "#3B82F6",
        is_auto_generated: bool = False
    ) -> Code:
        """Find existing code by name or create new one"""

        # Look for existing code with same name in the project
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Look for existing code
        existing_code = db.query(Code).filter(
            Code.project_id == project_id,
            Code.name == code_name
        ).first()

        if existing_code:
            return existing_code

        # Create new code
        return CodeService.create_code(
            db=db,
            name=code_name,
            project_id=project_id,
            created_by_id=user_id,
            description=description or f"Auto-created code: {code_name}",
            color=color,
            is_auto_generated=is_auto_generated
        )

    @staticmethod
    def smart_quote_code_assignment(
        db: Session,
        request: SmartQuoteCodeAssignment,
        user_id: int,
        is_auto_generated: bool = False
    ) -> Dict[str, Any]:
        """
        Intelligent quote + code assignment:
        1. Find or create quote for text selection
        2. Find or create code by name
        3. Assign code to quote
        4. Return comprehensive result
        """

        # Get document to determine project_id
        document = db.query(Document).filter(
            Document.id == request.document_id).first()
        if not document:
            raise ValueError("Document not found")

        # Check user access
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        PermissionChecker.check_document_access(db, request.document_id, user)

        # Find or create quote
        quote = CodeAssignmentService.find_or_create_quote(
            db=db,
            document_id=request.document_id,
            segment_id=request.segment_id,
            text=request.text,
            start_char=request.start_char,
            end_char=request.end_char,
            user_id=user_id
        )

        # Find or create code
        code = CodeAssignmentService.find_or_create_code(
            db=db,
            project_id=document.project_id,
            code_name=request.code_name,
            user_id=user_id,
            description=request.code_description,
            color=request.code_color,
            is_auto_generated=is_auto_generated
        )

        # Assign code to quote (if not already assigned)
        if code not in quote.codes:
            quote.codes.append(code)

        # Get the segment and also assign the code to it
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == quote.segment_id).first()
        if segment and code not in segment.codes:
            segment.codes.append(code)

        # Commit all changes at once
        db.commit()
        db.refresh(quote)
        db.refresh(code)
        if segment:
            db.refresh(segment)

        return {
            "quote": {
                "id": quote.id,
                "text": quote.text,
                "start_char": quote.start_char,
                "end_char": quote.end_char,
                "segment_id": quote.segment_id,
                "document_id": quote.document_id,
                "created_at": quote.created_at,
                "was_existing": len([q for q in db.query(Quote).filter(
                    Quote.segment_id == request.segment_id,
                    Quote.start_char == request.start_char,
                    Quote.end_char == request.end_char
                ).all()]) > 0
            },
            "code": {
                "id": code.id,
                "name": code.name,
                "description": code.description,
                "color": code.color,
                "project_id": code.project_id,
                "created_at": code.created_at,
                "is_auto_generated": is_auto_generated,
                "was_existing": code.name in [c.name for c in db.query(Code).filter(
                    Code.project_id == document.project_id
                ).all()]
            },
            "segment": {
                "id": segment.id if segment else None,
                "linked_to_code": segment is not None
            } if segment else None,
            "assignment_status": "success",
            "message": f"Successfully assigned code '{code.name}' to quote '{quote.text[:50]}...' and its segment"
        }

    @staticmethod
    def smart_segment_code_assignment(
        db: Session,
        request: SmartSegmentCodeAssignment,
        user_id: int,
        is_auto_generated: bool = False
    ) -> Dict[str, Any]:
        """
        Intelligent segment + code assignment:
        1. Validate segment access
        2. Find or create code by name
        3. Assign code to segment
        """

        # Get segment and validate access
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == request.segment_id
        ).first()
        if not segment:
            raise ValueError("Segment not found")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        # Check document access (segment belongs to document)
        PermissionChecker.check_document_access(db, segment.document_id, user)

        # Get project_id from document
        document = db.query(Document).filter(
            Document.id == segment.document_id).first()

        # Find or create code
        code = CodeAssignmentService.find_or_create_code(
            db=db,
            project_id=document.project_id,
            code_name=request.code_name,
            user_id=user_id,
            description=request.code_description,
            color=request.code_color,
            is_auto_generated=is_auto_generated
        )

        # Assign code to segment (if not already assigned)
        if code not in segment.codes:
            segment.codes.append(code)
            db.commit()
            db.refresh(segment)

        return {
            "segment": {
                "id": segment.id,
                "content": segment.content[:100] + "..." if len(segment.content) > 100 else segment.content,
                "document_id": segment.document_id,
                "segment_type": segment.segment_type
            },
            "code": {
                "id": code.id,
                "name": code.name,
                "description": code.description,
                "color": code.color,
                "project_id": code.project_id,
                "is_auto_generated": is_auto_generated,
                "was_existing": code.name in [c.name for c in db.query(Code).filter(
                Code.project_id == document.project_id
            ).all()]
            },
            "assignment_status": "success",
            "message": f"Successfully assigned code '{code.name}' to segment"
        }

    @staticmethod
    def smart_annotation_creation(
        db: Session,
        request: SmartAnnotationCreation,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Intelligent annotation creation:
        1. Auto-create quote if quote_text provided
        2. Create annotation on quote, segment, document, or code
        3. Return comprehensive result
        """

        quote_id = None
        annotation_data = {
            "content": request.content,
            "annotation_type": request.annotation_type
        }

        # If quote text is provided, create/find quote first
        if request.quote_text and request.document_id:
            # We need segment_id to create a quote, let's get it from document
            if not request.segment_id:
                # Get first segment of document
                first_segment = db.query(DocumentSegment).filter(
                    DocumentSegment.document_id == request.document_id
                ).first()
                if first_segment:
                    request.segment_id = first_segment.id

            if request.segment_id:
                quote = CodeAssignmentService.find_or_create_quote(
                    db=db,
                    document_id=request.document_id,
                    segment_id=request.segment_id,
                    text=request.quote_text,
                    start_char=request.quote_start_char or 0,
                    end_char=request.quote_end_char or len(request.quote_text),
                    user_id=user_id
                )
                quote_id = quote.id
                annotation_data["quote_id"] = quote_id

        # Set other targets
        if request.segment_id and not quote_id:
            annotation_data["segment_id"] = request.segment_id
        if request.document_id and not quote_id and not request.segment_id:
            annotation_data["document_id"] = request.document_id
        if request.code_id:
            annotation_data["code_id"] = request.code_id

        # Create annotation
        annotation = AnnotationService.create_annotation(
            db=db,
            user_id=user_id,
            **annotation_data
        )

        return {
            "annotation": {
                "id": annotation.id,
                "content": annotation.content,
                "annotation_type": annotation.annotation_type.value,
                "quote_id": annotation.quote_id,
                "segment_id": annotation.segment_id,
                "document_id": annotation.document_id,
                "code_id": annotation.code_id,
                "project_id": annotation.project_id,
                "created_at": annotation.created_at
            },
            "quote_created": quote_id is not None,
            "status": "success",
            "message": f"Successfully created {request.annotation_type.value.lower()} annotation"
        }
