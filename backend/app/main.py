"""Aplicación FastAPI de Food Store.

Ejecutar desde la carpeta backend/:  uvicorn app.main:app --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Al iniciar crea las tablas que falten (los datos los carga app.db.seed)."""
    create_all_tables()
    yield


app = FastAPI(
    title="Food Store API",
    description="Sistema de pedidos de comida. Trabajo Práctico Integrador - Programación 4.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS con credenciales: el navegador envía la cookie HttpOnly al backend solo
# si el origen está permitido explícitamente (no se puede usar "*").
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth_router, usuarios_router, categorias_router, productos_router, pedidos_router):
    app.include_router(router, prefix=API_PREFIX)


@app.get("/", include_in_schema=False)
def raiz() -> dict[str, str]:
    return {"message": "Food Store API", "docs": "/docs", "redoc": "/redoc"}
