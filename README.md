# ERP2025 - AXTECH ECOLED

Modern ERP solution with a FastAPI (Python) backend and a Vite + React 18 SPA frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm 9+
- SQL Server 2019+ (Azure SQL Edge for ARM64/Apple Silicon)
- Docker Desktop (recommended for local development)
- (Optional) `npx playwright install` for UI tests

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/AXTECH-Shop/ERP.git
cd ERP
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure environment
cp ../.env.example .env
# Edit .env with your database credentials

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at `http://localhost:8001`
- API Docs (Swagger): `http://localhost:8001/docs`
- Health Check: `http://localhost:8001/api/v1/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env.local
# Edit VITE_API_BASE_URL if backend is on different port

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 4. Database

The application connects to a SQL Server database. Configure the connection in `backend/.env`:

```env
DATABASE_URL=mssql+pymssql://user:password@host:1433/database_name
```

## Project Structure

```
ERP2025/
├── backend/                     # FastAPI Backend (Python)
│   ├── app/
│   │   ├── api/v1/             # REST API endpoints
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic layer
│   │   ├── repositories/       # Data access layer
│   │   └── main.py             # FastAPI application
│   ├── pyproject.toml          # Python dependencies
│   └── .env                    # Environment config (not in git)
│
├── frontend/                    # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── api/                # API client & hooks
│   │   ├── components/         # Reusable UI components
│   │   ├── routes/             # TanStack Router pages
│   │   ├── hooks/              # React Query hooks
│   │   └── i18n/               # Translations
│   ├── package.json
│   └── .env                    # Frontend config (not in git)
│
├── DOCUMENTATION/              # Project documentation
├── Legacy/                     # Legacy .NET application (reference only)
├── database/                   # Database scripts
├── deployment/                 # Deployment configurations
├── docker-compose.yml          # Docker services (Redis)
└── .env.example                # Environment template
```

## API Endpoints

Base URL: `/api/v1/`

### Core Entities

| Entity | List | Detail | Create | Update |
|--------|------|--------|--------|--------|
| Clients | GET `/clients` | GET `/clients/{id}` | POST `/clients` | PUT `/clients/{id}` |
| Suppliers | GET `/suppliers` | GET `/suppliers/{id}` | POST `/suppliers` | PUT `/suppliers/{id}` |
| Products | GET `/products` | GET `/products/{id}` | POST `/products` | PUT `/products/{id}` |
| Orders | GET `/orders` | GET `/orders/{id}` | POST `/orders` | PUT `/orders/{id}` |
| Quotes | GET `/quotes` | GET `/quotes/{id}` | POST `/quotes` | PUT `/quotes/{id}` |
| Invoices | GET `/invoices` | GET `/invoices/{id}` | POST `/invoices` | PUT `/invoices/{id}` |
| Deliveries | GET `/deliveries` | GET `/deliveries/{id}` | POST `/deliveries` | PUT `/deliveries/{id}` |
| Projects | GET `/projects` | GET `/projects/{id}` | POST `/projects` | PUT `/projects/{id}` |

### Warehouse & Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouse/warehouses` | List warehouses |
| GET | `/warehouse/warehouses/{id}` | Get warehouse detail |
| GET | `/warehouse/stock` | Search stock levels |
| GET | `/warehouse/movements` | Search stock movements |

### Lookup Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lookups/client-types` | Client types |
| GET | `/lookups/currencies` | Currencies |
| GET | `/lookups/payment-modes` | Payment modes |
| GET | `/lookups/societies` | Societies/Companies |
| GET | `/lookups/countries` | Countries |

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=mssql+pymssql://user:password@host:1433/database

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_SOCKET_URL=http://localhost:8001
VITE_APP_NAME=ERP System
VITE_USE_MOCK_API=false
```

## Development Commands

### Backend

```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload --port 8001

# Run tests
pytest

# Lint & format
ruff check .
black .
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - ORM with async support
- **Pydantic 2.0** - Data validation
- **SQL Server** - Database (via pymssql)
- **Redis** - Caching & sessions (optional)
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool
- **TanStack Router** - File-based routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **i18next** - Internationalization (FR/EN/ZH)

## i18n Support

The frontend supports three languages:
- French (fr) - Default
- English (en)
- Chinese (zh)

Language files are in `frontend/src/i18n/locales/`

## Business Unit Theming

Dynamic theming based on business unit:
- **LED**: Blue (#3B82F6)
- **DOMOTICS**: Pink (#EC4899)
- **HVAC**: Green (#10B981)
- **WAVE_CONCEPT**: Orange (#F97316)
- **ACCESSORIES**: Purple (#8B5CF6)

## Docker Deployment

```bash
# Start Redis
docker-compose up -d

# Or run full stack with Docker
docker-compose -f docker-compose.prod.yml up -d
```

## Legacy Application

The original .NET application is preserved in the `Legacy/` folder for reference:
- `Legacy/ERP.Web/` - ASP.NET 4.8 Web API
- `Legacy/ERP.DataServices/` - Business logic
- `Legacy/ERP.Repositories/` - Data access
- `Legacy/ERP.Entities/` - Domain models

## License

Proprietary - AXTECH
