from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime
from app.db.session import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)

    # Position within the segment (not the whole document)
    start_char = Column(Integer, nullable=True)
    end_char = Column(Integer, nullable=True)
    
    # References
    segment_id = Column(Integer, ForeignKey("document_segments.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    segment = relationship("DocumentSegment", back_populates="quotes")
    document = relationship("Document", back_populates="quotes")
    created_by = relationship("User", back_populates="created_quotes")
    codes = relationship("Code", secondary="quote_codes", back_populates="quotes")
    annotations = relationship("Annotation", back_populates="quote")

    def __repr__(self):
        truncated_text = self.text[:50] + "..." if len(self.text) > 50 else self.text
        return f"<Quote(id={self.id}, text='{truncated_text}', document_id={self.document_id})>"
