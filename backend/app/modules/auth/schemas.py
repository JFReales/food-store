"""Schemas de auth. El login NO devuelve el token en el cuerpo: va en la cookie."""

from sqlmodel import SQLModel


class Mensaje(SQLModel):
    message: str
