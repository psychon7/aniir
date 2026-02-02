# ERP System Refactor - FastAPI + SQL Server + React (Vite)

## 📋 Overview

This folder contains all documentation, prompts, and planning materials for refactoring the existing ASP.NET WebForms ERP system to a modern **FastAPI + SQL Server + React** stack.

**CRITICAL**: This is a **REFACTOR**, not a greenfield project. All existing data and functionality must be preserved.

### 🎯 Key Decision: FastAPI + SQL Server (Not PostgreSQL)

We chose this approach because:
1. **Same Database Schema** - No data migration required, connect directly to existing SQL Server
2. **Team Expertise** - Team has more FastAPI/Python experience than .NET
3. **Claude Code Efficiency** - Python/FastAPI generates higher quality code
4. **Faster Iteration** - No compile times, hot reload
5. **Existing Frontend** - Keep the existing React/Vite frontend with its polished design system

---

## 📁 Folder Structure

```
Refactor/
├── README.md                           # This file
├── prompts/                            # AI prompts for code generation
│   ├── prompt-1-foundation.md         # Backend + Auth (FastAPI + SQL Server)
│   ├── prompt-2-features.md           # PDF, Email, Accounting, Drive, Chat
│   └── prompt-3-integrations.md       # Shopify, Sage X3, SuperPDP
├── todos/                              # Granular task breakdowns
│   ├── todo-prompt-1.md               # ~100 tasks for foundation
│   ├── todo-prompt-2.md               # ~80 tasks for features
│   └── todo-prompt-3.md               # ~70 tasks for integrations
├── reference/                          # Consolidated reference documentation
│   ├── database-schema.md             # Complete SQL Server schema (65+ tables)
│   ├── business-logic.md              # All business rules and calculations
│   ├── frontend-modules.md            # Frontend modules and form fields
│   └── frontend-integration.md        # API patterns, error handling, components
├── migration/                          # Schema mapping docs (NO data migration)
│   └── schema-mapping.md              # SQLAlchemy model mappings
└── deployment/                         # Deployment configuration
    └── dokploy-config.md              # Dokploy deployment guide
```

---

## 🎯 Quick Start for 10 Parallel Claude Code Agents

### 1-Day Production Goal

| Agent | Focus Area | Time |
|-------|------------|------|
| **Agent 1** | Project scaffold + Docker Compose (FastAPI + SQL Server) | 1-2h |
| **Agent 2** | SQLAlchemy models for TR_* tables (16 reference tables) | 2h |
| **Agent 3** | SQLAlchemy models for TM_* tables (49 master tables) | 3h |
| **Agent 4** | Auth endpoints (JWT login/refresh/logout) | 2h |
| **Agent 5** | API: Clients, Contacts | 2h |
| **Agent 6** | API: Products, ProductInstances, Categories | 2h |
| **Agent 7** | API: Quotes, Orders, Invoices | 3h |
| **Agent 8** | API: Suppliers, Warehouse, Logistics | 2h |
| **Agent 9** | API: Lookups, Users, Settings | 2h |
| **Agent 10** | Dokploy deployment + integration testing | 2h |

**Total parallel time: ~4-5 hours** (not 50+ hours sequential)

### Pre-requisites
1. **Read reference documentation** (consolidated from legacy docs):
   - `reference/database-schema.md` - Complete SQL Server schema (65+ tables)
   - `reference/business-logic.md` - All business rules, calculations, validations
   - `reference/frontend-modules.md` - Frontend modules and form fields
   - `reference/frontend-integration.md` - API patterns, error handling, components

2. **Understand existing frontend:**
   - `../frontend/` - Keep as-is, only update API client to point to new FastAPI backend

---

## 🚨 Critical Requirements

### Database: KEEP SQL Server (NO Migration)

⚠️ **DO NOT migrate to PostgreSQL**

- **Connect directly** to existing SQL Server database
- **Same schema** - All 67+ tables remain unchanged
- **Same data** - Zero data migration, zero risk
- **Use SQLAlchemy** with `pyodbc` or `aioodbc` driver

### Frontend: KEEP Existing React App

⚠️ **DO NOT rebuild the frontend**

The existing frontend at `../frontend/` is production-ready with:
- **Design System**: DM Sans font, Instrument Serif headings, HSL color tokens
- **Business Unit Themes**: LED (#3B82F6), DOMOTICS (#EC4899), HVAC (#10B981), WAVECONCEPT (#F97316), ACCESSORIES (#8B5CF6)
- **UI Components**: shadcn/ui, Radix primitives, TailwindCSS
- **State Management**: Zustand (auth store, theme store)
- **Data Fetching**: TanStack Query v5
- **Routing**: TanStack Router
- **i18n**: i18next (EN, FR, ZH)

**Only update**: `frontend/src/api/client.ts` to point to new FastAPI backend.

### Testing Requirements

Before marking any prompt as complete:
- [ ] All 67+ tables mapped to SQLAlchemy models
- [ ] Connection to SQL Server working
- [ ] All API endpoints returning correct data
- [ ] Frontend can login and fetch data
- [ ] Docker Compose starts all services

---

## 📊 Progress Tracking

### Prompt 1: Foundation (FastAPI + SQL Server Backend)
- **Status**: 🔴 Not Started
- **Tasks**: ~100 tasks across 8 groups
- **Estimated Time**: 4-5 hours (10 parallel agents)
- **Dependencies**: None

### Prompt 2: Features
- **Status**: 🔴 Not Started
- **Tasks**: PDF, Email, Accounting, Drive
- **Estimated Time**: 3-4 hours
- **Dependencies**: Prompt 1 complete

### Prompt 3: Integrations
- **Status**: 🔴 Not Started
- **Tasks**: Shopify, Sage X3, SuperPDP
- **Estimated Time**: 4-5 hours
- **Dependencies**: Prompts 1 & 2 complete

### Deployment
- **Status**: 🔴 Not Started
- **Estimated Time**: 1-2 hours
- **Dependencies**: All prompts complete

---

## 🛠️ Tech Stack

### Backend (NEW - FastAPI)
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0 (async with aioodbc)
- **Database**: **SQL Server** (existing, unchanged)
- **Driver**: pyodbc / aioodbc
- **Cache**: Redis 7
- **Jobs**: Celery + Celery Beat
- **Storage**: MinIO (dev) / AWS S3 (prod)
- **Auth**: JWT (python-jose)
- **Password**: passlib + bcrypt

### Frontend (EXISTING - Keep As-Is)
- **Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 5
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query v5
- **State**: Zustand
- **UI**: shadcn/ui + Tailwind CSS 3
- **Forms**: React Hook Form + Zod
- **i18n**: i18next (EN, FR, ZH)
- **Icons**: Lucide React
- **Fonts**: DM Sans (body), Instrument Serif (headings)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: Dokploy (Linux containers)
- **Database**: SQL Server (Azure SQL or Docker mcr.microsoft.com/mssql/server)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

---

## 🎨 Design System Reference

The existing frontend uses a refined design system. **DO NOT change these styles.**

### Fonts
```css
/* Body text */
font-family: 'DM Sans', system-ui, sans-serif;
letter-spacing: -0.01em;

/* Headings */
font-family: 'Instrument Serif', Georgia, serif;
letter-spacing: -0.02em;
```

### Color Tokens (HSL)
```css
:root {
  --background: 0 0% 99%;
  --foreground: 220 20% 10%;
  --primary: 220 70% 45%;
  --secondary: 220 15% 96%;
  --muted: 220 15% 96%;
  --accent: 220 15% 94%;
  --destructive: 0 72% 51%;
  --border: 220 15% 91%;
  --radius: 0.625rem;
}
```

### Business Unit Colors
| BU | Color | Hex |
|----|-------|-----|
| LED | Blue | #3B82F6 |
| DOMOTICS | Pink | #EC4899 |
| HVAC | Green | #10B981 |
| WAVECONCEPT | Orange | #F97316 |
| ACCESSORIES | Purple | #8B5CF6 |

### Component Classes
- `.card-elevated` - Cards with subtle shadow
- `.btn-primary` - Primary buttons (dark bg)
- `.btn-secondary` - Secondary buttons (light bg)
- `.btn-ghost` - Ghost buttons
- `.input-refined` - Form inputs
- `.nav-link` / `.nav-link.active` - Navigation links
- `.stat-card` - Dashboard stat cards
- `.badge-success/warning/error` - Status badges
- `.table-refined` - Data tables

---

## 📖 Documentation Reference

### Existing System
- [Database Schema](../frontend/DOCUMENTATION/03-DATABASE-SCHEMA.md) - All 67+ tables
- [Business Logic](../frontend/DOCUMENTATION/04-BUSINESS-LOGIC.md) - Business rules
- [REST API Migration](../frontend/DOCUMENTATION/02-REST-API-MIGRATION.md) - API endpoint specs
- [ERP System Analysis](../DOCUMENTATION/ERP_SYSTEM_ANALYSIS.md) - Legacy system overview

### Existing Frontend (Keep As-Is)
- `../frontend/src/index.css` - Design system tokens & component classes
- `../frontend/tailwind.config.js` - Tailwind configuration
- `../frontend/src/stores/authStore.ts` - Auth state management
- `../frontend/src/components/ui/` - UI components (shadcn/ui)

### Refactor Documentation
- [Prompt 1: Foundation](prompts/prompt-1-foundation.md) - FastAPI + SQL Server backend
- [TODO Prompt 1](todos/todo-prompt-1.md) - Granular tasks for parallel agents
- [Schema Mapping](migration/schema-mapping.md) - SQLAlchemy model mappings
- [Dokploy Config](deployment/dokploy-config.md) - Deployment guide

---

## 🔄 Deployment Strategy (No Data Migration!)

### Phase 1: Build Backend (1 day)
- Generate FastAPI backend using prompts
- Map all 67+ tables to SQLAlchemy models
- Create all API endpoints
- Test connection to existing SQL Server

### Phase 2: Update Frontend (1 hour)
- Update `frontend/src/api/client.ts` base URL
- Update any endpoint paths if needed
- Test all screens

### Phase 3: Deploy to Dokploy (2 hours)
- Build Docker images
- Configure environment variables
- Set up SQL Server connection string
- Deploy to Dokploy

### Phase 4: Go Live (Instant)
- Point DNS to new deployment
- Zero downtime (same database)

---

## 🎯 Success Criteria

### Technical
- [ ] FastAPI backend connects to existing SQL Server
- [ ] All 67+ tables mapped to SQLAlchemy models
- [ ] All API endpoints working
- [ ] Existing frontend works with new backend
- [ ] Docker Compose runs all services
- [ ] Deployed to Dokploy

### Business
- [ ] Users can login with existing credentials
- [ ] All existing workflows work
- [ ] Same data visible (no migration needed)
- [ ] Improved API response times
- [ ] No Windows Server dependency

---

## 🆘 Quick Reference for Agents

### SQL Server Connection String
```python
# Using pyodbc (sync)
DATABASE_URL = "mssql+pyodbc://user:password@server:1433/ERP_ECOLED?driver=ODBC+Driver+18+for+SQL+Server"

# Using aioodbc (async)
DATABASE_URL = "mssql+aioodbc://user:password@server:1433/ERP_ECOLED?driver=ODBC+Driver+18+for+SQL+Server"
```

### SQLAlchemy Model Example
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    __tablename__ = "TM_CLI_Client"  # Keep exact table name!
    
    cli_id = Column("cli_id", Integer, primary_key=True)  # Keep exact column names!
    cli_company_name = Column("cli_company_name", String(500), nullable=False)
    cli_status_id = Column("cli_status_id", Integer, ForeignKey("TR_STA_Status.sta_id"))
    cli_is_active = Column("cli_is_active", Boolean, default=True)
    # ... map ALL existing columns
```

### API Response Format (Match Existing Frontend)
```python
# Paged response
{
    "success": True,
    "data": [...],
    "page": 1,
    "pageSize": 10,
    "totalCount": 150,
    "totalPages": 15
}

# Single item response
{
    "success": True,
    "data": {...}
}

# Error response
{
    "success": False,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [...]
    }
}
```

---

## 📝 Notes

- **Estimated Total Time**: 1 day (with 10 parallel agents)
- **Risk Level**: LOW (no data migration, same database)
- **Rollback Plan**: Point frontend back to old ASMX services

---

**Last Updated**: 2026-01-31  
**Version**: 2.0  
**Status**: Planning Phase - FastAPI + SQL Server Approach


