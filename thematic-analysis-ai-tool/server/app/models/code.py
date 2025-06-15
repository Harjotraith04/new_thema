from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Table
from sqlalchemy.orm import relationship
import datetime
from app.db.session import Base

# Association table for many-to-many relationship between quotes and codes
quote_codes = Table(
    'quote_codes',
    Base.metadata,
    Column('quote_id', Integer, ForeignKey('quotes.id'), primary_key=True),
    Column('code_id', Integer, ForeignKey('codes.id'), primary_key=True)
)


class Code(Base):
    __tablename__ = "codes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    definition = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    parent_id = Column(Integer, ForeignKey("codes.id"), nullable=True)

    color = Column(String, nullable=True)  # Hex color for UI

    is_active = Column(Boolean, default=True)

    is_auto_generated = Column(Boolean, default=False)
    properties = Column(JSON, nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="codes")
    created_by = relationship("User", back_populates="created_codes")

    # Code hierarchy
    parent = relationship("Code", remote_side=[id], back_populates="children")
    children = relationship(
        "Code", back_populates="parent", cascade="all, delete-orphan")
    
    # Many-to-many relationships
    segments = relationship("DocumentSegment", secondary="segment_codes", back_populates="codes")
    quotes = relationship("Quote", secondary="quote_codes", back_populates="codes")
    
    # Other relationships
    annotations = relationship("Annotation", back_populates="code")

    def __repr__(self):
        return f"<Code(id={self.id}, name='{self.name}', project_id={self.project_id})>"
