# Food Store — Sistema de pedidos de comida

**Trabajo Práctico Integrador · Programación 4 · TUPaD (UTN)**
Alumno: **Reales, Juan Francisco**

| | |
|---|---|
| Repositorio | **COMPLETAR:** `https://github.com/JFReales/food-store` |
| Video de demostración | **COMPLETAR:** link público (YouTube / Drive) |

Aplicación web completa para un negocio de comidas. Los clientes se registran,
recorren el catálogo, arman un carrito y confirman pedidos. El administrador
gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

- **Backend:** FastAPI + SQLModel + PostgreSQL, arquitectura en capas con
  Unit of Work, JWT en cookie HttpOnly y roles `user` / `admin`.
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, TanStack Query, Form y
  Table, Zustand, Axios y React Router, organizado por features.

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Python | 3.11 a 3.13 |
| PostgreSQL | 15 o superior (para desarrollo también se puede usar SQLite) |
| Node.js | 20.19 o superior |
| pnpm | 9 o superior (`npm install -g pnpm`) |

---

## Puesta en marcha

Se necesitan **dos terminales**: una para el backend y otra para el frontend.

### 1. Backend (`backend/`)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate              # Windows (PowerShell / cmd)
# source .venv/Scripts/activate     # Windows con Git Bash
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt
cp .env.example .env                # Windows cmd: copy .env.example .env
#   -> editar .env: DATABASE_URL con el usuario y la contraseña de tu PostgreSQL
python -m app.db.seed               # crea la base, las tablas y los datos iniciales
uvicorn app.main:app --reload
```

- API: <http://localhost:8000/api/v1>
- Documentación: <http://localhost:8000/docs> y <http://localhost:8000/redoc>

Si la base indicada en `DATABASE_URL` no existe, el backend **la crea solo**:
alcanza con tener PostgreSQL corriendo y un usuario con permiso para crear
bases (por ejemplo, `postgres`).

### 2. Frontend (`frontend/`)

```bash
cd frontend
pnpm install
cp .env.example .env                # Windows cmd: copy .env.example .env
pnpm build                          # verifica los tipos (tsc -b) y genera el build
pnpm dev                            # http://localhost:5173
```

Abrir <http://localhost:5173>. El servidor de Vite usa siempre el puerto 5173,
porque es el origen que habilita el CORS del backend (`FRONTEND_ORIGIN`).

---

## Usuario administrador (seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |

`python -m app.db.seed` es **idempotente**: crea el admin, 4 categorías
(Pizzas, Hamburguesas, Empanadas y Bebidas) y 10 productos con stock. Se puede
ejecutar varias veces sin duplicar datos. Los clientes se crean desde la
pantalla de registro (rol `user`).

---

## Variables de entorno

### `backend/.env` (plantilla: `backend/.env.example`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://postgres:postgres@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Firma del JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido en CORS (con credenciales) | `http://localhost:5173` |

- Para desarrollo sin PostgreSQL: `DATABASE_URL=sqlite:///./foodstore.db`.
- `postgresql://` y `postgresql+psycopg2://` funcionan igual. El backend
  fuerza el driver `psycopg2` porque, desde SQLAlchemy 2.1, `postgresql://`
  usa por defecto `psycopg` 3, que no está instalado.

### `frontend/.env` (plantilla: `frontend/.env.example`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

> Usar `localhost` (y no `127.0.0.1`) tanto en el navegador como en
> `VITE_API_URL`. La cookie de sesión es `SameSite=Lax`: si el frontend y la
> API se abren con nombres de host distintos, el navegador no la envía.

---

## Arquitectura

### Backend: módulos por dominio y capas

```
backend/
├── app/
│   ├── main.py                 # FastAPI, CORS con credenciales y routers con /api/v1
│   ├── core/
│   │   ├── config.py           # Settings (pydantic-settings) leídas de .env
│   │   ├── database.py         # engine, create_all_tables, session_factory
│   │   ├── security.py         # bcrypt, create_access_token, decode_access_token
│   │   ├── deps.py             # get_current_user, get_current_active_user, require_role
│   │   ├── unit_of_work.py     # UnitOfWork: commit / rollback / close en __exit__
│   │   ├── base_repository.py  # BaseRepository[T]: get_by_id, get_all, add, delete
│   │   └── utils.py
│   ├── modules/
│   │   ├── auth/               # router, service, schemas (usa el modelo Usuario)
│   │   ├── usuarios/           # models, schemas, repository, unit_of_work, service, router
│   │   ├── categorias/         # ídem
│   │   ├── productos/          # ídem
│   │   └── pedidos/            # ídem (Pedido y DetallePedido)
│   └── db/seed.py              # carga inicial idempotente
├── requirements.txt            # versiones fijadas (passlib[bcrypt]==1.7.4, bcrypt==4.0.1)
└── .env.example
```

Cadena **Router → Service → Unit of Work → Repository → Model**. Las
dependencias van en una sola dirección:

- **Router:** valida el cuerpo con los schemas, resuelve sesión y rol con
  `Depends`, obtiene el Service con `Depends(get_<modulo>_service)` y traduce
  las excepciones de dominio a `HTTPException`. No abre el Unit of Work.
- **Service:** aplica las reglas de negocio dentro de `with self.uow as uow:` y
  devuelve el schema de salida **dentro** del bloque.
- **Unit of Work:** abre la sesión y expone los repositorios que la comparten.
  El **commit ocurre solo en su `__exit__`**; si hubo una excepción, hace
  rollback. Ningún Service ni Router llama a `session.commit()`.
- **Repository:** consultas con `select`, sin reglas de negocio.

### Modelo de datos

Cinco tablas según el UML: `usuario`, `categoria`, `producto`, `pedido` y
`detallepedido`. Las relaciones se declaran con `Relationship` y
`back_populates`:

- `Categoria.productos` ↔ `Producto.categoria`
- `Usuario.pedidos` ↔ `Pedido.usuario`
- `Pedido.items` ↔ `DetallePedido.pedido`
- `Producto.detalles` ↔ `DetallePedido.producto`

Las bajas son **lógicas**: `activo` en categorías y productos, `disponible`
en productos, `disabled` en usuarios. Los pedidos no se borran: se cancelan.
Cada línea del pedido **copia** el nombre y el precio del producto.

### Reglas de negocio

| Regla | Implementación |
|---|---|
| **RN-01** Crear pedido | Al menos un ítem y ningún producto repetido. Por cada ítem, en la misma iteración: se lee el producto **bloqueando su fila** (`SELECT … FOR UPDATE`), se verifica que esté activo, disponible y con stock, se descuenta el stock y se crea la línea copiando `nombre_producto` y `precio_unitario`. El total es la suma de los subtotales. Todo es una transacción: si algo falla no se guarda nada, tampoco el stock. |
| **RN-02** Transiciones | Mapa `TRANSICIONES` en `pedidos/service.py`. PENDIENTE → EN_PREPARACION o CANCELADO; EN_PREPARACION → ENTREGADO o CANCELADO; los estados terminales no cambian (400). |
| **RN-03** Cancelar | Restituye el stock de cada línea en la misma transacción que cambia el estado. |
| **RN-04** Permisos | El cliente ve y cancela solo sus pedidos y solo en PENDIENTE (403 si es ajeno). El admin ve todos y avanza o cancela cualquier pedido no terminal. |
| **RN-05** Inmutabilidad | No hay endpoint para editar ni borrar pedidos. Cambiar el precio de un producto no altera pedidos ya hechos. |
| **RN-06** Datos | `forma_pago` es `EFECTIVO` o `TRANSFERENCIA` y `direccion_entrega` tiene entre 5 y 200 caracteres (422 desde el schema). |

### Autenticación

1. `POST /api/v1/auth/token` (formulario OAuth2) valida las credenciales y
   guarda el JWT en la cookie **HttpOnly** `access_token` (30 minutos). La
   respuesta no incluye el token.
2. El navegador envía la cookie en cada petición (Axios con
   `withCredentials: true`). El frontend **nunca lee ni guarda el token**.
3. Del lado del backend:
   - `get_current_user` lee la cookie y valida la firma y la expiración (401);
   - `get_current_active_user` rechaza usuarios desactivados (400 «Cuenta de
     usuario desactivada»);
   - `require_role(["admin"])` controla el rol (403).
4. `POST /api/v1/auth/logout` borra la cookie.

### Frontend: organización por features

```
frontend/src/
├── shared/
│   ├── api/            # axiosInstance (withCredentials + interceptor de 401), handleApiError, queryClient
│   ├── ui/             # Button, Card, Input, Modal, BadgeEstado
│   ├── components/     # Paginacion, Skeleton, EstadoVacio, EstadoError, TablaDatos (TanStack Table)
│   ├── layout/         # Navbar, MainLayout
│   ├── hooks/          # useDebounce
│   └── utils/
├── features/
│   ├── auth/           # LoginPage, RegisterPage, UnauthorizedPage
│   ├── categorias/     # AdminCategoriasPage, CategoriaForm, useCategorias
│   ├── productos/      # CatalogoPage, AdminProductosPage, ProductoCard, ProductoForm, StockForm, useProductos
│   ├── usuarios/       # AdminUsuariosPage, useUsuarios
│   └── pedidos/        # CarritoPage, CheckoutPage, MisPedidosPage, AdminPedidosPage, AdminResumenPage
│       └── (pages/ components/ hooks/ api/ types/ en cada feature)
├── store/              # authStore y cartStore (Zustand + persist)
├── routes/             # AppRouter (BrowserRouter) y ProtectedRoute
├── App.tsx             # checkSession al montar + AppRouter
└── main.tsx            # QueryClientProvider
```

- **Estado del servidor (TanStack Query):** catálogo, pedidos, usuarios y
  resumen se obtienen con `useQuery`, con claves descriptivas como
  `['productos', filtros]`. Las escrituras usan `useMutation` y en
  `onSuccess` ejecutan `invalidateQueries`. Crear o cancelar un pedido
  invalida también `productos`, porque cambia el stock.
- **Estado del cliente (Zustand + persist):**
  - `authStore` guarda solo el usuario (`partialize`), nunca el token.
  - `cartStore` guarda el carrito, que sobrevive a la recarga de la página.
- **Sin `fetch` dentro de `useEffect`:** la única llamada en un efecto es
  `checkSession` al montar la aplicación.
- **Interceptor de Axios:** ante un 401, o un 400 «Cuenta de usuario
  desactivada», limpia la sesión y `ProtectedRoute` redirige a `/login`.
- **`ProtectedRoute`:** sin sesión redirige a `/login`; sin el rol, a
  `/unauthorized`. La protección real es `require_role` en el backend.
- **Formularios con TanStack Form:** login, registro, checkout, categorías,
  productos y stock.
- **Tablas del panel con TanStack Table:** ordenamiento y paginación del lado
  del cliente (el panel pide `limit=100`).
- **TypeScript** con `strict: true` y sin `any`.

### Pantallas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/` | Público | Catálogo paginado en el servidor, con búsqueda, filtro por categoría, skeleton y estado vacío |
| `/login`, `/register` | Público | Formularios con TanStack Form |
| `/carrito` | Público | Ítems, cantidades, subtotal y total (persiste al recargar) |
| `/checkout` | Sesión | Dirección, forma de pago y notas → `POST /pedidos` |
| `/mis-pedidos` | Sesión | Pedidos propios con detalle; cancelar en PENDIENTE |
| `/admin/resumen` | admin | Tarjetas con los indicadores |
| `/admin/pedidos` | admin | Tabla con filtro por estado y botones según la máquina de estados |
| `/admin/productos` | admin | ABM, stock y disponibilidad |
| `/admin/categorias` | admin | ABM |
| `/admin/usuarios` | admin | Activar y desactivar (sin «Desactivar» en la fila propia) |
| `/unauthorized` | Público | Sin permiso |

---

## Endpoints (`/api/v1`)

| Método | Endpoint | Acceso | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | Público | 201 · 409 |
| POST | `/auth/token` | Público | 200 · 401 · 400 |
| POST | `/auth/logout` | Público | 200 |
| GET | `/auth/me` | Sesión | 200 |
| GET | `/admin/usuarios` | admin | 200 |
| POST | `/admin/usuarios/{id}/activar` | admin | 200 · 404 |
| POST | `/admin/usuarios/{id}/desactivar` | admin | 200 · 404 · 400 (a sí mismo) |
| GET | `/categorias` | Público | 200 |
| GET | `/categorias/{id}` | Público | 200 · 404 |
| POST | `/categorias` | admin | 201 · 409 |
| PUT | `/categorias/{id}` | admin | 200 · 404 · 409 |
| DELETE | `/categorias/{id}` | admin | 204 · 404 |
| GET | `/productos?skip&limit&search&categoria_id&disponible` | Público | 200 `{ total, items }` |
| GET | `/productos/{id}` | Público | 200 · 404 |
| POST | `/productos` | admin | 201 · 404 |
| PUT | `/productos/{id}` | admin | 200 · 404 |
| PATCH | `/productos/{id}/stock` | admin | 200 · 404 |
| DELETE | `/productos/{id}` | admin | 204 · 404 |
| POST | `/pedidos` | Sesión | 201 · 404 · 400 |
| GET | `/pedidos?skip&limit&estado` | Sesión | 200 `{ total, items }` |
| GET | `/pedidos/resumen` | admin | 200 |
| GET | `/pedidos/{id}` | Dueño o admin | 200 · 404 · 403 |
| PATCH | `/pedidos/{id}/estado` | admin | 200 · 404 · 400 |
| PATCH | `/pedidos/{id}/cancelar` | Dueño | 200 · 404 · 403 · 400 |

En todos los endpoints con sesión: 401 si falta la sesión, 400 si la cuenta
está desactivada, 403 si el rol no corresponde y 422 si el cuerpo no es
válido. Todos los errores tienen la forma `{ "detail": "..." }`.

---

## Problemas frecuentes

- **`pip install` falla en Windows con "No such file or directory …
  opentelemetry …"**: la ruta de la carpeta es demasiado larga (más de 260
  caracteres dentro de `.venv`). Hay que descomprimir el proyecto en una
  carpeta más corta (por ejemplo, `C:\foodstore`) o activar las rutas largas
  de Windows.
- **El login funciona pero las demás pantallas responden 401**: se está
  mezclando `localhost` y `127.0.0.1` (ver la nota de `VITE_API_URL`).
- **`password authentication failed`**: revisar el usuario y la contraseña de
  PostgreSQL en `DATABASE_URL`.
- **`column producto.categoria_id does not exist`** (o similar): la base de
  `DATABASE_URL` ya tenía tablas con el mismo nombre de otro proyecto, y
  `create_all` no modifica tablas existentes. Hay que usar una base dedicada
  (por ejemplo, `foodstore_db`).
