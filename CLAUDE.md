# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

### Backend (FastAPI + SQL Server)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev              # Dev server at http://localhost:5173
npm run build            # Production build
npm run build:typecheck  # Type check + build
```

### Testing
```bash
cd backend
pytest                          # Run all tests
pytest tests/test_clients.py    # Run single test file
pytest -k "test_create"         # Run tests matching pattern
pytest --cov=app                # With coverage report
```

### Linting
```bash
# Backend
cd backend
ruff check .    # Lint (fast)
black .         # Format
isort .         # Sort imports
mypy app/       # Type check

# Frontend
cd frontend
npm run lint    # ESLint
```

## Architecture

### Backend Layer Structure
```
app/
├── api/v1/endpoints/   # REST endpoints (FastAPI routers)
├── services/           # Business logic (20+ service classes)
├── repositories/       # Data access layer
├── models/             # SQLAlchemy ORM models
└── schemas/            # Pydantic request/response schemas
```

**Pattern:** Endpoints → Services → Repositories → Models

Services use `asyncio.to_thread()` for async compatibility with synchronous pymssql driver (SQL Server 2008 compatibility requirement).

### Frontend Layer Structure
```
src/
├── routes/       # TanStack Router file-based routing
├── hooks/        # React Query hooks for data fetching
├── api/          # Axios client with interceptors
├── stores/       # Zustand state management
└── components/   # Reusable UI components
```

**Pattern:** Routes → Hooks (React Query) → API Client → Backend

### Dependency Injection
- Backend uses FastAPI's `Depends()` for DB sessions
- Services are instantiated with DB session via factory functions
- Example: `get_client_service(db: Session = Depends(get_db))`

## Database Conventions

### Table Naming
- `TR_*` - Reference/lookup tables
- `TM_*` - Master entity tables
- `TI_*` - Intermediate/junction tables
- `TS_*` - Site-specific tables

### Column Naming
- `[abbr]_id` - Primary key (e.g., `cli_id`, `prd_id`)
- `[abbr]_ref` - Reference number
- `[abbr]_code` - System-generated code
- `[abbr]_d_creation` - Creation date
- `[abbr]_d_update` - Last update date
- `[abbr]_isactive` - Boolean active flag

### Key Tables
| Entity | Table | Key |
|--------|-------|-----|
| Client | TM_CLI_Client | cli_id |
| Product | TM_PRD_Product | prd_id |
| Order | TM_COD_Client_Order | cod_id |
| Quote | TM_CPL_Cost_Plan | cpl_id |
| Invoice | TM_CIN_Client_Invoice | cin_id |
| Delivery | TM_DFO_Delivery_Form | dfo_id |
| Supplier | TM_SUP_Supplier | sup_id |

### Document Flow
`Project → Quote (CPL) → Order (COD) → Delivery (DFO) → Invoice (CIN) → Payment (CPY)`

## API Conventions

- Base URL: `/api/v1/`
- Swagger docs: `http://localhost:8001/docs`
- Health check: `GET /api/v1/health`

### Schema Pattern
Backend schemas use computed properties to convert snake_case DB columns to camelCase for frontend:
```python
@computed_field
@property
def companyName(self) -> str:
    return self.cli_company_name
```

## Environment Configuration

Backend reads from `backend/.env`:
```env
DATABASE_URL=mssql+pymssql://user:password@host:1433/database
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-min-32-chars
CORS_ORIGINS_STR=http://localhost:5173,http://localhost:3000
```

Frontend uses Vite dev proxy: `/api` → `http://localhost:8000`

## Key Code Patterns

### Adding a New Endpoint
1. Create schema in `app/schemas/`
2. Create service in `app/services/`
3. Create endpoint in `app/api/v1/endpoints/`
4. Register router in `app/api/v1/__init__.py`

### Adding a New Frontend Hook
1. Add API method in `src/api/`
2. Create hook in `src/hooks/` using React Query
3. Use query keys consistently for cache management

### i18n
- Supported: French (default), English, Chinese
- Files: `frontend/src/i18n/locales/{fr,en,zh}.json`

## Code Style

### Backend (Python)
- Line length: 100 characters
- Python 3.11+ target
- Type hints required (mypy strict)
- Async endpoints using `asyncio.to_thread()` for DB calls

### Frontend (TypeScript)
- Strict TypeScript mode
- Path alias: `@/` maps to `src/`
- Tailwind CSS for styling
- Zod for runtime validation
