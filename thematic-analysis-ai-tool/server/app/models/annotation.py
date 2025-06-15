from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
import datetime
import enum
from app.db.session import Base


class AnnotationType(enum.Enum):
    COMMENT = "COMMENT"
    MEMO = "MEMO"
    QUESTION = "QUESTION"
    INSIGHT = "INSIGHT"
    TODO = "TODO"
    REVIEW = "REVIEW"


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    annotation_type = Column(Enum(AnnotationType),
                             default=AnnotationType.COMMENT)

    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    segment_id = Column(Integer, ForeignKey(
        "document_segments.id"), nullable=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)
    code_id = Column(Integer, ForeignKey("codes.id"), nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    parent_id = Column(Integer, ForeignKey("annotations.id"), nullable=True)
    annotation_metadata = Column(JSON, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)    # Relationships
    document = relationship("Document", back_populates="annotations")
    segment = relationship("DocumentSegment", back_populates="annotations")
    quote = relationship("Quote", back_populates="annotations")
    code = relationship("Code", back_populates="annotations")
    project = relationship("Project", back_populates="annotations")
    created_by = relationship("User", back_populates="created_annotations")

    # Threading
    parent = relationship("Annotation", remote_side=[
                          id], back_populates="replies")
    replies = relationship(
        "Annotation", back_populates="parent", cascade="all, delete-orphan")

    def __repr__(self):
        truncated_content = self.content[:50] + \
            "..." if len(self.content) > 50 else self.content
        return f"<Annotation(id={self.id}, type={self.annotation_type.value}, content='{truncated_content}')>"
