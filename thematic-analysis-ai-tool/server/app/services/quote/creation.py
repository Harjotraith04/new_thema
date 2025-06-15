"""
Quote creation and management service - Updated for segment-based quotes
"""
from sqlalchemy.orm import Session
from typing import Optional
import datetime

from app.core.permissions import PermissionChecker
from app.core.validators import ValidationUtils
from app.models.quote import Quote
from app.models.document import Document
from app.models.document_segment import DocumentSegment
from app.models.code import Code
from app.models.user import User


class QuoteCreationService:
    """Service for creating and managing segment-based quotes"""

    @staticmethod
    def create_quote(
        db: Session,
        text: str,
        segment_id: int,
        created_by_id: int,
        start_char: Optional[int] = None,
        end_char: Optional[int] = None,
        # Auto-filled from segment if not provided
        document_id: Optional[int] = None
    ) -> Quote:
        """Create a new quote linked to a document segment"""

        # Get user object
        user = db.query(User).filter(User.id == created_by_id).first()
        if not user:
            raise ValueError("User not found")

        # Validate segment exists and get document info
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise ValueError("Document segment not found")

        # Use document_id from segment if not provided
        if document_id is None:
            document_id = segment.document_id
        elif document_id != segment.document_id:
            raise ValueError("Document ID does not match segment's document")

        # Validate document exists and user has access
        document = PermissionChecker.check_document_access(
            db, document_id, user, raise_exception=False
        )
        if not document:
            raise ValueError("Document not found or access denied")

        # Validate position range if provided
        if start_char is not None and end_char is not None:
            ValidationUtils.validate_position_range(start_char, end_char)

            # Validate positions are within the segment content
            if end_char > len(segment.content):
                raise ValueError(
                    f"End position ({end_char}) exceeds segment content length ({len(segment.content)})")

            # Extract the actual text from the segment if positions are provided
            if text != segment.content[start_char:end_char]:
                # Allow slight mismatch for whitespace, but warn if significantly different
                extracted_text = segment.content[start_char:end_char]
                if text.strip() != extracted_text.strip():
                    raise ValueError(
                        f"Provided text does not match segment content at specified positions")

        # Create quote
        quote = Quote(
            text=text,
            start_char=start_char,
            end_char=end_char,
            segment_id=segment_id,
            document_id=document_id,
            created_by_id=created_by_id
        )

        db.add(quote)
        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def assign_code_to_quote(
        db: Session,
        quote_id: int,
        code_id: int,
        user_id: int
    ) -> Quote:
        """Assign a code to a quote"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        # Get document for project validation
        document = db.query(Document).filter(
            Document.id == quote.document_id).first()

        # Validate code
        code = db.query(Code).filter(
            Code.id == code_id,
            Code.project_id == document.project_id
        ).first()
        if not code:
            raise ValueError("Code not found in this project")

        quote.code_id = code_id
        quote.updated_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def remove_code_from_quote(
        db: Session,
        quote_id: int,
        user_id: int
    ) -> Quote:
        """Remove code assignment from a quote"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        quote.code_id = None
        quote.updated_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def update_quote(
        db: Session,
        quote_id: int,
        user_id: int,
        **update_data
    ) -> Quote:
        """Update a quote with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        # Get document for project validation
        document = db.query(Document).filter(
            Document.id == quote.document_id).first()

        # Validate position range if provided
        if 'start_position' in update_data or 'end_position' in update_data:
            start_pos = update_data.get('start_position', quote.start_position)
            end_pos = update_data.get('end_position', quote.end_position)
            if start_pos is not None and end_pos is not None and start_pos >= end_pos:
                raise ValueError(
                    "Start position must be less than end position")

        # Check if code exists (if provided)
        if 'code_id' in update_data and update_data['code_id']:
            code = db.query(Code).filter(
                Code.id == update_data['code_id'],
                Code.project_id == document.project_id
            ).first()
            if not code:
                raise ValueError("Code not found in this project")

        # Update fields (excluding None values)
        for field, value in update_data.items():
            if value is not None and hasattr(quote, field):
                setattr(quote, field, value)

        quote.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(quote)

        return quote

    @staticmethod
    def delete_quote(
        db: Session,
        quote_id: int,
        user_id: int
    ) -> bool:
        """Delete a quote"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the quote
        quote = PermissionChecker.check_quote_access(
            db, quote_id, user, raise_exception=False
        )
        if not quote:
            raise ValueError("Quote not found or access denied")

        db.delete(quote)
        db.commit()

        return True
