"""Unit of Work base.

Abre la sesión en __enter__ y en __exit__ hace commit (si no hubo excepción)
o rollback (si la hubo), y siempre close. Es el ÚNICO lugar que hace commit:
ningún Service ni Router llama a session.commit().
"""

from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    def __init__(self, factory: Callable[[], Session] = session_factory) -> None:
        self._factory = factory
        self._session: Session | None = None

    @property
    def session(self) -> Session:
        if self._session is None:
            raise RuntimeError("El Unit of Work no está abierto: usar 'with uow:'")
        return self._session

    def __enter__(self) -> Self:
        self._session = self._factory()
        self._crear_repositorios(self._session)
        return self

    def _crear_repositorios(self, session: Session) -> None:
        """Cada módulo lo redefine para exponer sus repositorios sobre la misma sesión."""

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()
            self._session = None
        # No suprime la excepción: el Router la traduce a HTTP.
