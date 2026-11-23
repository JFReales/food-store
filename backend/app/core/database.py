"""Base de datos: engine, creación de tablas y fábrica de sesiones.

Admite PostgreSQL (recomendado) y SQLite (desarrollo) cambiando DATABASE_URL.
"""

from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine, text

from app.core.config import settings


def _normalizar_url(url: str) -> str:
    """Fuerza el driver psycopg2 en las URLs de PostgreSQL.

    Desde SQLAlchemy 2.1, "postgresql://" usa por defecto psycopg (versión 3),
    que no está instalado: el proyecto usa psycopg2-binary. Así funciona tanto
    "postgresql://..." como "postgresql+psycopg2://...".
    """
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = _normalizar_url(settings.DATABASE_URL)
ES_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    # SQLite no permite por defecto usar una conexión desde otro hilo.
    connect_args={"check_same_thread": False} if ES_SQLITE else {},
)


def _crear_base_postgres_si_no_existe() -> None:
    """Crea la base de PostgreSQL indicada en DATABASE_URL si todavía no existe."""
    url = make_url(DATABASE_URL)
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as conexion:
            existe = conexion.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :nombre"),
                {"nombre": url.database},
            ).first()
            if existe is None:
                conexion.execute(text(f'CREATE DATABASE "{url.database}"'))
    finally:
        admin.dispose()


def create_all_tables() -> None:
    """Crea la base (PostgreSQL) y las tablas que falten."""
    # Importar los modelos los registra en SQLModel.metadata.
    from app.modules.categorias import models as _categorias  # noqa: F401
    from app.modules.pedidos import models as _pedidos  # noqa: F401
    from app.modules.productos import models as _productos  # noqa: F401
    from app.modules.usuarios import models as _usuarios  # noqa: F401

    if not ES_SQLITE:
        _crear_base_postgres_si_no_existe()
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una sesión nueva. La usa el UnitOfWork (y la dependencia de auth)."""
    return Session(engine)
