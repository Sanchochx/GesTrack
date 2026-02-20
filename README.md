# GesTrack

A full-stack inventory and order management system for small-to-medium businesses. GesTrack provides real-time stock tracking, customer management, and order processing through a REST API backend and a modern React frontend.

---

## Features

- **Authentication & Authorization** — JWT-based login with role-based access control (Admin, Warehouse Manager, Sales Staff)
- **Product & Category Management** — Create, update, and organize products with image uploads
- **Inventory Control** — Real-time stock tracking with WebSocket updates, movement history, and automated alerts
- **Customer Management** — Full customer lifecycle with deletion audit logs
- **Order Processing** — End-to-end order creation and management
- **Dashboard** — Inventory value history and key metrics at a glance

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python / Flask | Web framework |
| Flask-SQLAlchemy | ORM |
| Flask-Migrate | Database migrations |
| Flask-JWT-Extended | Authentication |
| Flask-SocketIO | Real-time WebSocket events |
| Flask-CORS | Cross-origin resource sharing |
| PostgreSQL (psycopg2) | Primary database |
| Marshmallow | Schema validation & serialization |
| bcrypt | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| MUI (Material UI) | Component library |
| React Router v7 | Client-side routing |
| Axios | HTTP client |
| Socket.IO Client | Real-time updates |
| Recharts | Data visualization |
| React Hook Form | Form state management |

---

## Project Structure

```
GesTrack/
├── backend/                  # Flask REST API
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routes/           # Blueprint route handlers
│   │   ├── schemas/          # Marshmallow schemas
│   │   ├── services/         # Business logic layer
│   │   └── utils/            # Shared utilities
│   ├── migrations/           # Alembic migration files
│   ├── tests/                # Backend test suite
│   ├── requirements.txt
│   └── run.py                # Application entry point
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # Route-level page components
    │   │   ├── Auth/
    │   │   ├── Dashboard/
    │   │   ├── Products/
    │   │   ├── Categories/
    │   │   ├── Inventory/
    │   │   ├── Customers/
    │   │   ├── Orders/
    │   │   └── Profile/
    │   ├── services/         # API service layer
    │   ├── hooks/            # Custom React hooks
    │   └── utils/            # Shared utilities
    ├── index.html
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL, secret key, etc.

# Run database migrations
flask db upgrade

# Start the development server
python run.py
```

The API will be available at `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=postgresql://user:password@localhost:5432/gestrack
CORS_ORIGIN=http://localhost:5173
UPLOAD_FOLDER=uploads
```

---

## API

The backend exposes a REST API under `/api`. Full documentation is available in [`backend/API_DOCUMENTATION.md`](./backend/API_DOCUMENTATION.md).

**Main endpoint groups:**

| Prefix | Description |
|---|---|
| `/api/auth` | Register, login, password reset |
| `/api/categories` | Product categories |
| `/api/products` | Product CRUD & image upload |
| `/api/stock` | Stock levels & real-time updates |
| `/api/inventory` | Movement history & alerts |
| `/api/customers` | Customer management |
| `/api/orders` | Order creation & tracking |

---

## User Roles

| Role | Description |
|---|---|
| Admin | Full system access |
| Gerente de Almacén | Inventory and product management |
| Personal de Ventas | Customer and order management |
