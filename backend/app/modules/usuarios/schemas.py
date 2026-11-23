"""Schemas de usuarios. UserPublic nunca expone hashed_password."""

from datetime import datetime
from typing import Annotated

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel

Username = Annotated[
    str,
    StringConstraints(strip_whitespace=True, pattern=r"^[A-Za-z0-9_.-]+$"),
    Field(min_length=3, max_length=50),
]
NombreCompleto = Annotated[
    str, StringConstraints(strip_whitespace=True), Field(min_length=2, max_length=120)
]


class UserCreate(SQLModel):
    username: Username
    full_name: NombreCompleto
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=72)]


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime
