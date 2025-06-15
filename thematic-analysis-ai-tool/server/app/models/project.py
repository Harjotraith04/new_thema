from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
import datetime
from app.db.session import Base

project_collaborators = Table(
    'project_collaborators',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship(
        "User", back_populates="owned_projects", foreign_keys=[owner_id])

    collaborators = relationship(
        "User",
        secondary=project_collaborators,
        back_populates="collaborated_projects"
    )

    documents = relationship(
        "Document", back_populates="project", cascade="all, delete-orphan")
    codes = relationship("Code", back_populates="project",
                         cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="project")

    created_at = Column(DateTime, default=datetime.datetime.now(
        datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc),
                        onupdate=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"
