from sqlalchemy.orm import Session
from app.repositories.user import UserRepository
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import ValidationError, CredentialsException

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in: UserRegister) -> User:
        # Check if email is already taken
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise ValidationError(detail="Email already registered")

        # Create new user
        hashed_pwd = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            password_hash=hashed_pwd,
            full_name=user_in.full_name,
            role="Business User" # default role is Business User
        )
        return self.user_repo.create(new_user)

    def authenticate_user(self, credentials: UserLogin) -> User:
        user = self.user_repo.get_by_email(credentials.email)
        if not user:
            raise CredentialsException(detail="Incorrect email or password")
        
        if not verify_password(credentials.password, user.password_hash):
            raise CredentialsException(detail="Incorrect email or password")
            
        return user

    def generate_token(self, user: User) -> str:
        return create_access_token(subject=str(user.id))
