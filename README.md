# ERP2025 - ECOLED EUROPE

Modern ERP solution composed of an ASP.NET 4.8 REST API backend (`ERP.Web`) and a Vite + React 18 SPA (`frontend`). This document walks through the full setup for local development.

## Prerequisites

- Windows 10/11 with [Visual Studio 2022](https://visualstudio.microsoft.com/vs/) and the **ASP.NET and web development** workload
- .NET Framework 4.8 Developer Pack (required by `ERP.Web`)
- SQL Server 2019+ (Express is fine) and SQL Server Management Studio for running scripts in `/SQL`
- Node.js 18+ and npm 9+ (used by the Vite frontend)
- (Optional) Docker Desktop if you prefer containerized infrastructure
- (Optional) `npx playwright install` to provision browsers for UI tests

## Quick Start

1. **Clone & restore packages**
   ```bash
   git clone <repo-url>
   cd ERP2025
   nuget restore ERP.sln
   ```
2. **Configure the backend**  
   Update `ERP.Web/Web.config` with your SQL Server connection string and JWT keys (see [Backend Setup](#backend-setup-erpweb)).
3. **Prepare the database**  
   Run the scripts provided in `SQL/` to seed the schema/data expected by the services.
4. **Run the backend**  
   Open `ERP.sln` in Visual Studio, select `ERP.Web` and start with IIS Express (or configure a local IIS site).
5. **Configure & run the frontend**
   ```bash
   cd frontend
   cp .env.development .env.local   # adjust VITE_* values as needed
   npm install
   npm run dev
   ```
   The SPA is now available at `http://localhost:5173` and proxies API calls to `http://localhost:44300/api/v1` by default.

## Project Structure

```
ERP2025/
├── frontend/                    # React SPA (Vite + TypeScript)
├── ERP.Web/                     # ASP.NET Web Application + REST API
│   ├── Api/                     # REST API Layer (Controllers, DTOs, Helpers)
│   ├── App_Start/               # Web API, JWT, Swagger configuration
│   ├── Services/                # Legacy ASMX services
│   └── Views/                   # ASPX Pages
├── ERP.DataServices/            # Business Logic Layer
├── ERP.Repositories/            # Data Access Layer
├── ERP.Entities/                # Domain Entities
├── ERP.SharedServices/          # PDF generators, notifications, etc.
├── SQL/                         # Database scripts
├── scripts/                     # Utility scripts (build/deploy)
├── deployment/                  # Infra-as-code / deployment assets
└── Packages/                    # NuGet packages cache
```

## Backend Setup (`ERP.Web`)

1. **Restore NuGet dependencies**
   - Use Visual Studio's Package Manager Console (`Update-Package -reinstall`) or `nuget restore ERP.sln`.
2. **Configuration**
   - `ERP.Web/Web.config` → update `connectionStrings` with your SQL Server instance.
   - `appSettings` → set JWT options:
     ```xml
     <add key="JwtSecretKey" value="YOUR_SECRET_KEY_MIN_32_CHARS" />
     <add key="JwtAccessTokenExpiryMinutes" value="15" />
     <add key="JwtRefreshTokenExpiryDays" value="7" />
     ```
   - Adjust `AllowedCorsOrigins` to include your frontend origin (e.g., `http://localhost:5173`).
3. **Database**
   - Execute the schema/data scripts under `SQL/` in the following order: schema definition, lookup data, and seed data (if provided).
4. **Running locally**
   - Set `ERP.Web` as the startup project and press `F5` in Visual Studio to launch IIS Express, or publish to a local IIS site.
   - Swagger is exposed via `/swagger` once the site is running, enabling quick endpoint validation.
5. **Backend tooling**
   - Run unit/integration tests (if any) from Test Explorer.
   - Use `scripts/` for CI/CD helper commands when deploying.

## Frontend Setup (`frontend/`)

1. **Environment variables**
   - Templates live in `.env.development` and `.env.production`.
   - Common keys:
     - `VITE_API_BASE_URL` → default `http://localhost:44300/api/v1`
     - `VITE_USE_MOCK_API` → `true` for local mocks, `false` for real API
   - Create `.env.local` for machine-specific overrides.
2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   # open http://localhost:5173
   ```
4. **Build & preview**
   ```bash
   npm run build
   npm run preview
   ```
5. **Lint & tests**
   ```bash
   npm run lint
   npx playwright test
   ```
   Playwright config lives in `frontend/playwright.config.ts`; tests reside in `frontend/tests/`.

## API Endpoints

Base URL: `/api/v1/`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/password, returns JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (invalidate session) |
| GET | `/auth/me` | Get current user info |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clients` | Search clients with pagination |
| GET | `/clients/{id}` | Get client by ID |
| POST | `/clients` | Create new client |
| PUT | `/clients/{id}` | Update client |
| GET | `/clients/{id}/contacts` | Get client contacts |
| POST | `/clients/{id}/activate` | Activate client |
| POST | `/clients/{id}/deactivate` | Deactivate client |
| POST | `/clients/{id}/block` | Block client |
| POST | `/clients/{id}/unblock` | Unblock client |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Search products with pagination |
| GET | `/products/{id}` | Get product by ID |
| GET | `/products/{id}/instances` | Get product variants |
| GET | `/products/{id}/photos` | Get product photos |
| GET | `/products/types` | Get all product types |
| GET | `/products/categories` | Get all categories |
| POST | `/products/{id}/activate` | Activate product |
| POST | `/products/{id}/deactivate` | Deactivate product |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/{id}` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/{id}` | Update user |
| POST | `/users/{id}/change-password` | Change user password |
| GET | `/users/sub-commercials` | Get sub-commercials |

### Lookup Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lookup/client-types` | Get client types |
| GET | `/lookup/currencies` | Get currencies |
| GET | `/lookup/vat-rates` | Get VAT rates |
| GET | `/lookup/payment-modes` | Get payment modes |
| GET | `/lookup/payment-conditions` | Get payment conditions |
| GET | `/lookup/trade-terms` | Get trade terms (Incoterms) |
| GET | `/lookup/civilities` | Get civilities |
| GET | `/lookup/activities` | Get activities |
| GET | `/lookup/languages` | Get languages |
| GET | `/lookup/line-types` | Get line types |
| GET | `/lookup/costplan-statuses` | Get cost plan statuses |
| GET | `/lookup/statuses` | Get general statuses |
| GET | `/lookup/communes?postcode=xxx` | Get communes by postcode |
| GET | `/lookup/colors` | Get colors for society |
| GET | `/lookup/roles` | Get user roles |
| GET | `/lookup/header-footer` | Get header/footer text settings |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Call `/auth/login` with username/password
2. Receive `accessToken` (15 min) and `refreshToken` (7 days)
3. Include `Authorization: Bearer {accessToken}` header in requests
4. When access token expires, call `/auth/refresh` with refresh token

## Business Unit Theming

The frontend supports dynamic theming based on business unit:
- **LED**: Blue (#3B82F6)
- **DOMOTICS**: Pink (#EC4899)
- **HVAC**: Green (#10B981)
- **WAVE_CONCEPT**: Orange (#F97316)
- **ACCESSORIES**: Purple (#8B5CF6)

## i18n Support

The frontend supports three languages:
- French (fr) - Default
- English (en)
- Chinese (zh)

Language files are in `frontend/src/i18n/locales/`

## Tech Stack

### Backend
- ASP.NET 4.8 WebForms + Web API 2
- Entity Framework 4
- SQL Server
- JWT Authentication
- Swagger/OpenAPI Documentation

### Frontend
- React 18
- TypeScript 5
- Vite 5
- TanStack Router
- TanStack Query
- Zustand (State Management)
- Tailwind CSS + shadcn/ui
- i18next (Internationalization)
