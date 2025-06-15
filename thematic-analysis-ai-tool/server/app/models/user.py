from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)

    owned_projects = relationship(
        "Project", back_populates="owner", foreign_keys="Project.owner_id")
    collaborated_projects = relationship(
        "Project",
        secondary="project_collaborators",
        back_populates="collaborators"
    )
    uploaded_documents = relationship("Document", back_populates="uploaded_by")
    created_quotes = relationship("Quote", back_populates="created_by")
    created_codes = relationship("Code", back_populates="created_by")
    created_annotations = relationship("Annotation", back_populates="created_by")
