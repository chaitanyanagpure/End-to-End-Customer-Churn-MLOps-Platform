from fastapi import Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import CredentialsException, PermissionDeniedException
from app.repositories.user import UserRepository
from app.models.user import User
from uuid import UUID

reusable_oauth2 = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db),
    token: HTTPAuthorizationCredentials = Security(reusable_oauth2)
) -> User:
    user_id_str = decode_access_token(token.credentials)
    if not user_id_str:
        raise CredentialsException()

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise CredentialsException(detail="Invalid credentials format")

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_uuid)
    if not user:
        raise CredentialsException(detail="User not found")
    
    return user

def check_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "Admin":
        raise PermissionDeniedException(detail="Requires Admin privileges")
    return current_user
