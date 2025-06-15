from fastapi import APIRouter, Depends
from app.schemas.user import UserOut
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: UserOut = Depends(get_current_user)):
    return current_user