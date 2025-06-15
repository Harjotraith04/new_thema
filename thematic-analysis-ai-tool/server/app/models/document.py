from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from app.db.session import Base


class DocumentType(enum.Enum):
    TEXT = "text"
    CSV = "csv"
    PDF = "pdf"
    DOCX = "docx"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Cloudinary integration
    cloudinary_public_id = Column(String, nullable=True)
    cloudinary_url = Column(String, nullable=True)

    file_size = Column(Integer, nullable=True)
    file_hash = Column(String, nullable=True)
    content = Column(JSON, nullable=True)
    file_metadata = Column(JSON, nullable=True)

    document_type = Column(Enum(DocumentType), nullable=False)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    processed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="documents")
    uploaded_by = relationship("User", back_populates="uploaded_documents")
    segments = relationship(
        "DocumentSegment", back_populates="document", cascade="all, delete-orphan")
    quotes = relationship("Quote", back_populates="document",
                          cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="document")

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', type={self.document_type.value})>"
