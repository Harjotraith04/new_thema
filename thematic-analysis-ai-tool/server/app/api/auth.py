from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.services.user_service import create_user, get_or_create_oauth_user, authenticate_user
from app.core.auth import get_current_user
from app.db.session import get_db
from app.core.oauth import (
    get_google_redirect_url, exchange_code_for_token, get_google_user_info,
    get_github_redirect_url, exchange_github_code_for_token, get_github_user_info
)
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.email,
                             user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/login/google")
def login_google():
    return RedirectResponse(get_google_redirect_url())

@router.get("/auth/callback", response_model=Token)
def google_auth_callback(request: Request, code: str, db: Session = Depends(get_db)):
    try:
        token = exchange_code_for_token(code)
        user_info = get_google_user_info(token)
        user = get_or_create_oauth_user(db, user_info, provider="google")

        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        return RedirectResponse(frontend_url)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Google OAuth error: {str(e)}")

@router.get("/login/github")
def login_github():
    return RedirectResponse(get_github_redirect_url())

@router.get("/auth/github/callback", response_model=Token)
def github_auth_callback(request: Request, code: str, db: Session = Depends(get_db)):
    try:
        token = exchange_github_code_for_token(code)
        user_info = get_github_user_info(token)

        if not user_info.get("email"):
            raise HTTPException(
                status_code=400, detail="GitHub account must have a public email")

        user = get_or_create_oauth_user(db, user_info, provider="github")

        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        return RedirectResponse(frontend_url)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"GitHub OAuth error: {str(e)}")

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: UserOut = Depends(get_current_user)):
    return current_user
