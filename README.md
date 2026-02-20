# GesTrack (En desarrollo)

Sistema de gestión de inventario y pedidos para pequeñas y medianas empresas. GesTrack ofrece seguimiento de stock en tiempo real, gestión de clientes y procesamiento de pedidos a través de una API REST en el backend y un frontend moderno en React.

---

## Funcionalidades

- **Autenticación y Autorización** — Inicio de sesión con JWT y control de acceso basado en roles (Admin, Gerente de Almacén, Personal de Ventas)
- **Gestión de Productos y Categorías** — Creación, edición y organización de productos con carga de imágenes
- **Control de Inventario** — Seguimiento de stock en tiempo real con actualizaciones por WebSocket, historial de movimientos y alertas automáticas
- **Gestión de Clientes** — Ciclo de vida completo del cliente con auditoría de eliminaciones
- **Procesamiento de Pedidos** — Creación y seguimiento de pedidos de extremo a extremo
- **Dashboard** — Historial de valor del inventario y métricas clave en un vistazo

---

## Stack Tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| Python / Flask | Framework web |
| Flask-SQLAlchemy | ORM |
| Flask-Migrate | Migraciones de base de datos |
| Flask-JWT-Extended | Autenticación |
| Flask-SocketIO | Eventos WebSocket en tiempo real |
| Flask-CORS | Control de acceso entre orígenes |
| PostgreSQL (psycopg2) | Base de datos principal |
| Marshmallow | Validación y serialización de esquemas |
| bcrypt | Hash de contraseñas |

### Frontend
| Tecnología | Uso |
|---|---|
| React 19 | Framework de UI |
| Vite | Herramienta de build y servidor de desarrollo |
| MUI (Material UI) | Biblioteca de componentes |
| React Router v7 | Enrutamiento del lado del cliente |
| Axios | Cliente HTTP |
| Socket.IO Client | Actualizaciones en tiempo real |
| Recharts | Visualización de datos |
| React Hook Form | Gestión de formularios |

---

## Estructura del Proyecto

```
GesTrack/
├── backend/                  # API REST con Flask
│   ├── app/
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── routes/           # Manejadores de rutas (Blueprints)
│   │   ├── schemas/          # Esquemas Marshmallow
│   │   ├── services/         # Capa de lógica de negocio
│   │   └── utils/            # Utilidades compartidas
│   ├── migrations/           # Archivos de migración Alembic
│   ├── tests/                # Suite de pruebas del backend
│   ├── requirements.txt
│   └── run.py                # Punto de entrada de la aplicación
│
└── frontend/                 # SPA en React
    ├── src/
    │   ├── components/       # Componentes de UI reutilizables
    │   ├── pages/            # Componentes de página por ruta
    │   │   ├── Auth/
    │   │   ├── Dashboard/
    │   │   ├── Products/
    │   │   ├── Categories/
    │   │   ├── Inventory/
    │   │   ├── Customers/
    │   │   ├── Orders/
    │   │   └── Profile/
    │   ├── services/         # Capa de servicios para la API
    │   ├── hooks/            # Custom React hooks
    │   └── utils/            # Utilidades compartidas
    ├── index.html
    └── vite.config.js
```

---

## Instalación y Puesta en Marcha

### Requisitos Previos

- Python 3.10+
- Node.js 18+
- PostgreSQL

### Configuración del Backend

```bash
cd backend

# Crear y activar el entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de la base de datos, clave secreta, etc.

# Ejecutar migraciones de la base de datos
flask db upgrade

# Iniciar el servidor de desarrollo
python run.py
```

La API estará disponible en `http://localhost:5000`.

### Configuración del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de Entorno

Crear un archivo `.env` dentro del directorio `backend/`:

```env
FLASK_ENV=development
SECRET_KEY=tu-clave-secreta
JWT_SECRET_KEY=tu-jwt-secreto
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/gestrack
CORS_ORIGIN=http://localhost:5173
UPLOAD_FOLDER=uploads
```

---

## API

El backend expone una API REST bajo el prefijo `/api`. La documentación completa está disponible en [`backend/API_DOCUMENTATION.md`](./backend/API_DOCUMENTATION.md).

**Grupos de endpoints principales:**

| Prefijo | Descripción |
|---|---|
| `/api/auth` | Registro, inicio de sesión y recuperación de contraseña |
| `/api/categories` | Categorías de productos |
| `/api/products` | CRUD de productos y carga de imágenes |
| `/api/stock` | Niveles de stock y actualizaciones en tiempo real |
| `/api/inventory` | Historial de movimientos y alertas |
| `/api/customers` | Gestión de clientes |
| `/api/orders` | Creación y seguimiento de pedidos |

---

## Roles de Usuario

| Rol | Descripción |
|---|---|
| Admin | Acceso completo al sistema |
| Gerente de Almacén | Gestión de inventario y productos |
| Personal de Ventas | Gestión de clientes y pedidos |
