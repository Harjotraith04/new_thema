from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password


def create_user(db: Session, user: UserCreate):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise ValueError("Email already registered")

    db_user = User(email=user.email,
                   hashed_password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not user.hashed_password:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_or_create_oauth_user(db: Session, user_info, provider="google"):
    email = user_info["email"]
    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.oauth_provider:
            user.oauth_provider = provider
            user.oauth_id = user_info.get("id") or user_info.get(
                "login")
            db.commit()
        return user

    new_user = User(
        email=email,
        oauth_provider=provider,
        oauth_id=user_info.get("id") or user_info.get(
            "login")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
