"""Hash de contraseñas (bcrypt) y JWT."""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return _pwd_context.verify(password, hashed_password)


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    """JWT firmado con SECRET_KEY; "sub" es el username y "exp" la expiración."""
    minutos = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": datetime.now(UTC) + timedelta(minutes=minutos),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Devuelve el username del token, o None si la firma es inválida o venció."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
