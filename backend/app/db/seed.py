"""Carga inicial idempotente: admin, categorías y productos.

Ejecutar desde la carpeta backend/:  python -m app.db.seed

Se puede correr varias veces: cada registro se busca antes de crearlo, así
no se duplican filas.
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "password": "Admin1234!",
    "full_name": "Administrador Food Store",
    "email": "admin@foodstore.com",
}

CATEGORIAS = {
    "Pizzas": "Pizzas artesanales a la piedra",
    "Hamburguesas": "Hamburguesas caseras con papas",
    "Empanadas": "Empanadas al horno",
    "Bebidas": "Gaseosas, aguas y jugos",
}


def _img(foto: str) -> str:
    """Foto de Unsplash (servida por su CDN, sin clave de API)."""
    return f"https://images.unsplash.com/photo-{foto}?w=480&h=320&fit=crop&q=70"


# (categoría, nombre, descripción, precio, stock, id de la foto en Unsplash)
PRODUCTOS = [
    ("Pizzas", "Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 8500.0, 20, "1513104890138-7c749659a591"),
    ("Pizzas", "Pizza Napolitana", "Muzzarella, tomate en rodajas y ajo", 9800.0, 15, "1574071318508-1cdbab80d002"),
    ("Pizzas", "Pizza Fugazzeta", "Muzzarella y cebolla caramelizada", 9500.0, 12, "1565299624946-b28f40a0ae38"),
    ("Hamburguesas", "Hamburguesa Clásica", "Carne, lechuga, tomate y queso", 7200.0, 25, "1568901346375-23c9450c58cd"),
    ("Hamburguesas", "Hamburguesa Doble Cheddar", "Doble carne y doble cheddar", 9900.0, 18, "1553979459-d2229ba7433b"),
    ("Empanadas", "Empanada de Carne", "Carne cortada a cuchillo", 1300.0, 60, "1601050690597-df0568f70950"),
    ("Empanadas", "Empanada de Jamón y Queso", "Jamón cocido y muzzarella", 1200.0, 50, "1601050690597-df0568f70950"),
    ("Empanadas", "Empanada de Humita", "Choclo cremoso", 1250.0, 40, "1601050690597-df0568f70950"),
    ("Bebidas", "Gaseosa Cola 1,5 L", "Botella de 1,5 litros", 3200.0, 30, "1581636625402-29b2a704ef13"),
    ("Bebidas", "Agua Mineral 500 ml", "Sin gas", 1500.0, 40, "1548839140-29a749e1cf4d"),
]


def cargar(session: Session) -> None:
    # Admin
    if session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first() is None:
        session.add(
            Usuario(
                username=ADMIN["username"],
                full_name=ADMIN["full_name"],
                email=ADMIN["email"],
                hashed_password=hash_password(ADMIN["password"]),
                role="admin",
            )
        )
        print(f"  + usuario admin ({ADMIN['username']} / {ADMIN['password']})")

    # Categorías
    categorias: dict[str, Categoria] = {}
    for nombre, descripcion in CATEGORIAS.items():
        categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
        if categoria is None:
            categoria = Categoria(nombre=nombre, descripcion=descripcion)
            session.add(categoria)
            session.flush()
            print(f"  + categoría {nombre}")
        categorias[nombre] = categoria

    # Productos
    for cat, nombre, descripcion, precio, stock, foto in PRODUCTOS:
        if session.exec(select(Producto).where(Producto.nombre == nombre)).first() is None:
            session.add(
                Producto(
                    categoria_id=categorias[cat].id,  # type: ignore[arg-type]
                    nombre=nombre,
                    descripcion=descripcion,
                    precio_base=precio,
                    imagen_url=_img(foto),
                    stock=stock,
                )
            )
            print(f"  + producto {nombre}")

    session.commit()


def main() -> None:
    create_all_tables()
    with session_factory() as session:
        cargar(session)
    print("Seed completo.")


if __name__ == "__main__":
    main()
