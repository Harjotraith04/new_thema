from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException
from typing import List, Optional

from app.models.document_segment import DocumentSegment
from app.models.code import Code
from app.schemas.document_segment import (
    DocumentSegmentCreate,
    DocumentSegmentUpdate,
    DocumentSegmentWithCodes,
    DocumentSegmentOut
)


class DocumentSegmentService:
    
    @staticmethod
    def get_document_segments(document_id: int, db: Session, skip: Optional[int] = None, limit: Optional[int] = None) -> List[DocumentSegmentOut]:
        # Build base query with eager-load of codes
        query = (
            db.query(DocumentSegment)
            .options(selectinload(DocumentSegment.codes))
            .filter(DocumentSegment.document_id == document_id)
            .order_by(DocumentSegment.line_number, DocumentSegment.character_start)
        )
        # Apply pagination if provided
        if skip is not None:
            query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)
        db_segments = query.all()
        # Map ORM objects to Pydantic schemas
        output_segments: List[DocumentSegmentOut] = []
        for seg in db_segments:
            code_names = [code.name for code in getattr(seg, 'codes', [])]
            seg_dict = {
                'id': seg.id,
                'document_id': seg.document_id,
                'segment_type': seg.segment_type,
                'content': seg.content,
                'line_number': seg.line_number,
                'page_number': seg.page_number,
                'paragraph_index': seg.paragraph_index,
                'row_index': seg.row_index,
                'character_start': seg.character_start,
                'character_end': seg.character_end,
                'additional_data': seg.additional_data,
                'created_at': seg.created_at,
                'updated_at': seg.updated_at,
                'is_coded': bool(code_names),
                'code_names': code_names,
            }
            output_segments.append(DocumentSegmentOut(**seg_dict))
        return output_segments

    @staticmethod
    def get_segment(segment_id: int, db: Session) -> DocumentSegmentWithCodes:
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")
        return segment

    @staticmethod
    def create_segment(segment: DocumentSegmentCreate, db: Session) -> DocumentSegmentOut:
        db_segment = DocumentSegment(**segment.model_dump())
        db.add(db_segment)
        db.commit()
        db.refresh(db_segment)
        return db_segment

    @staticmethod
    def update_segment(segment_id: int, segment_update: DocumentSegmentUpdate, db: Session) -> DocumentSegmentOut:
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")

        update_data = segment_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(segment, field, value)

        db.commit()
        db.refresh(segment)
        return segment

    @staticmethod
    def assign_codes_to_segment(segment_id: int, code_ids: List[int], db: Session) -> DocumentSegmentWithCodes:
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")

        codes = db.query(Code).filter(Code.id.in_(code_ids)).all()
        if len(codes) != len(code_ids):
            raise HTTPException(
                status_code=404, detail="One or more codes not found")
        # Ensure codes are unique in the segment
        for code in codes:
            if code not in segment.codes:
                segment.codes.append(code)

        db.commit()
        db.refresh(segment)
        return segment

    @staticmethod
    def remove_code_from_segment(segment_id: int, code_id: int, db: Session) -> dict:
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")

        code = db.query(Code).filter(Code.id == code_id).first()
        if not code:
            raise HTTPException(status_code=404, detail="Code not found")

        if code in segment.codes:
            segment.codes.remove(code)
            db.commit()
            # db.refresh(segment) # Refresh if returning the segment object
            return {"message": "Code removed from segment successfully"}
        else:
            return {"message": "Code not found in segment or already removed"}

    @staticmethod
    def delete_segment(segment_id: int, db: Session) -> dict:
        segment = db.query(DocumentSegment).filter(
            DocumentSegment.id == segment_id).first()
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")

        db.delete(segment)
        db.commit()
        return {"message": "Segment deleted successfully"}
