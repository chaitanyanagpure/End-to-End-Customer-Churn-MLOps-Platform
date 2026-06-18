from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, check_admin
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token, UpdateRole
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.repositories.user import UserRepository
from app.models.user import User
from typing import List
from uuid import UUID

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.register_user(user_in)
    audit_service = AuditService(db)
    audit_service.log_action(user.id, "USER_REGISTRATION", f"User {user.email} registered.")
    return user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(credentials)
    access_token = auth_service.generate_token(user)
    audit_service = AuditService(db)
    audit_service.log_action(user.id, "USER_LOGIN", f"User {user.email} logged in.")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@router.get("/users", response_model=List[UserOut])
def get_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin)
):
    user_repo = UserRepository(db)
    return user_repo.list_all()

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: UUID,
    role_in: UpdateRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin)
):
    user_repo = UserRepository(db)
    updated_user = user_repo.update_role(user_id, role_in.role)
    return updated_user
