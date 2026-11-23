"""Utilidades compartidas."""

from datetime import UTC, datetime


def ahora() -> datetime:
    """Fecha y hora actual en UTC (para created_at / updated_at)."""
    return datetime.now(UTC)
