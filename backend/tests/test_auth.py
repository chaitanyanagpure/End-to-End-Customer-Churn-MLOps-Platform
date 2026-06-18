import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from datetime import timedelta

def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_tokens():
    subject = "user-uuid-12345"
    token = create_access_token(subject=subject, expires_delta=timedelta(minutes=5))
    
    assert token is not None
    decoded = decode_access_token(token)
    assert decoded == subject

def test_invalid_jwt_token():
    assert decode_access_token("invalid.token.signature") is None
