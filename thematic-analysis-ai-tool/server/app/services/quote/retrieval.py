"""
Quote retrieval and search service
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.core.permissions import PermissionChecker
from app.models.quote import Quote
from app.models.document import Document
from app.models.project import Project
from app.models.code import Code
from app.models.user import User


class QuoteRetrievalService:
    """Service for retrieving and searching quotes"""
    @staticmethod
    def get_quotes_by_document(
        db: Session,
        document_id: int,
        user_id: int,
        code_id: Optional[int] = None
    ) -> List[Quote]:
        """Get all quotes for a document"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to document
        document = PermissionChecker.check_document_access(
            db, document_id, user, raise_exception=False
        )
        if not document:
            return []

        query = db.query(Quote).filter(Quote.document_id == document_id)

        if code_id:
            # Use many-to-many relationship to filter by code
            from app.models import quote_codes
            query = query.join(quote_codes).filter(
                quote_codes.c.code_id == code_id)

        return query.order_by(Quote.start_char, Quote.created_at).all()

    @staticmethod
    def get_quotes_by_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List[Quote]:
        """Get all quotes for a specific code"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            return []

        # Use many-to-many relationship to get quotes
        from app.models import quote_codes
        return db.query(Quote).join(quote_codes).filter(
            quote_codes.c.code_id == code_id
        ).order_by(Quote.created_at).all()

    @staticmethod
    def search_quotes(
        db: Session,
        project_id: int,
        user_id: int,
        search_text: str,
        document_id: Optional[int] = None,
        code_id: Optional[int] = None
    ) -> List[Quote]:
        """Search quotes by text content"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            return []        # Build query
        query = db.query(Quote).join(Document).filter(
            Document.project_id == project_id,
            Quote.text.ilike(f"%{search_text}%")
        )

        if document_id:
            query = query.filter(Quote.document_id == document_id)

        if code_id:
            # Use many-to-many relationship to filter by code
            from app.models import quote_codes
            query = query.join(quote_codes).filter(
                quote_codes.c.code_id == code_id)

        return query.order_by(Quote.created_at.desc()).all()    @ staticmethod

    def get_quote_context(
        db: Session,
        quote_id: int,
        context_chars: int = 200
    ) -> Dict[str, str]:
        """Get surrounding context for a quote from its segment"""
        from app.models.document_segment import DocumentSegment

        quote = db.query(Quote).filter(Quote.id == quote_id).first()
        if not quote:
            return {}

        # Get the segment for this quote
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == quote.segment_id).first()
        if not segment or not segment.content:
            return {"quote_text": quote.text}

        if quote.start_char is not None and quote.end_char is not None:
            # Calculate context boundaries within the segment
            content = segment.content
            start_context = max(0, quote.start_char - context_chars)
            end_context = min(len(content), quote.end_char + context_chars)

            before_context = content[start_context:quote.start_char]
            quote_text = content[quote.start_char:quote.end_char]
            after_context = content[quote.end_char:end_context]

            return {
                "before_context": before_context,
                "quote_text": quote_text,
                "after_context": after_context,
                "full_context": before_context + quote_text + after_context,
                "segment_id": quote.segment_id
            }

        return {"quote_text": quote.text}    @ staticmethod

    def get_overlapping_quotes(
        db: Session,
        segment_id: int,
        start_char: int,
        end_char: int
    ) -> List[Quote]:
        """Find quotes that overlap with the given character range in a segment"""

        return db.query(Quote).filter(
            Quote.segment_id == segment_id,
            Quote.start_char.isnot(None),
            Quote.end_char.isnot(None),
            Quote.start_char < end_char,
            Quote.end_char > start_char
        ).all()

    @staticmethod
    def get_quotes_by_project_with_details(
        db: Session,
        project_id: int,
        user_id: int,
        code_id: Optional[int] = None,
        document_id: Optional[int] = None,
        created_by_id: Optional[int] = None
    ) -> List[Any]:
        """Get all quotes for a project with detailed information"""
        from app.schemas.quote import QuoteWithDetails

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            return []        # Build query with joins for details
        from app.models.user import User as UserModel

        # Base query without code join first
        base_query = db.query(
            Quote,
            Document.name.label('document_name'),
            UserModel.email.label('created_by_email')
        ).join(
            Document, Quote.document_id == Document.id
        ).join(
            UserModel, Quote.created_by_id == UserModel.id
        ).filter(
            Document.project_id == project_id
        )

        # Apply filters
        if document_id:
            base_query = base_query.filter(Quote.document_id == document_id)
        if created_by_id:
            base_query = base_query.filter(
                Quote.created_by_id == created_by_id)

        if code_id:
            # Filter by specific code using many-to-many relationship
            from app.models import quote_codes
            base_query = base_query.join(quote_codes).filter(
                quote_codes.c.code_id == code_id)

        results = base_query.order_by(Quote.created_at.desc()).all()

        # Transform results and get code names for each quote
        quotes_with_details = []
        for quote, doc_name, user_email in results:
            # Get all code names for this quote
            code_names = [
                code.name for code in quote.codes] if quote.codes else []
            code_name = ', '.join(code_names) if code_names else None

            quote_dict = {
                **quote.__dict__,
                'document_name': doc_name,
                'code_name': code_name,
                'created_by_email': user_email
            }
            quotes_with_details.append(QuoteWithDetails(**quote_dict))

        return quotes_with_details
