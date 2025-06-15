from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Table
from sqlalchemy.orm import relationship
import datetime
from app.db.session import Base

# Many-to-many association table for segments and codes
segment_codes = Table(
    'segment_codes',
    Base.metadata,
    Column('segment_id', Integer, ForeignKey(
        'document_segments.id'), primary_key=True),
    Column('code_id', Integer, ForeignKey('codes.id'), primary_key=True)
)


class DocumentSegment(Base):
    __tablename__ = "document_segments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    # Segment details
    # "line", "sentence", "csv_row", etc.
    segment_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Positioning information - use as needed based on document type
    line_number = Column(Integer, nullable=True)  # For text files
    page_number = Column(Integer, nullable=True)  # For PDF files
    paragraph_index = Column(Integer, nullable=True)  # For DOCX files
    row_index = Column(Integer, nullable=True)  # For CSV files
    # Character position in document
    character_start = Column(Integer, nullable=True)
    # Character position in document
    character_end = Column(Integer, nullable=True)

    # Additional metadata for any extra data (e.g., CSV row data)
    additional_data = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="segments")
    codes = relationship("Code", secondary=segment_codes,
                         back_populates="segments")
    quotes = relationship("Quote", back_populates="segment",
                          cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="segment")

    def __repr__(self):
        truncated_content = self.content[:50] + \
            "..." if len(self.content) > 50 else self.content
        return f"<DocumentSegment(id={self.id}, type='{self.segment_type}', content='{truncated_content}')>"

    @property
    def is_coded(self):
        """Check if this segment has any codes attached"""
        return len(self.codes) > 0

    @property
    def code_names(self):
        """Get list of code names for this segment"""
        return [code.name for code in self.codes]
