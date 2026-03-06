# Ad Publication System — Backend API

> **Milestone 1: Core System Foundation** — Node.js + Express + PostgreSQL (Prisma ORM)

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh) + bcryptjs |
| Validation | Joi |
| Docs | Swagger UI (`/api/docs`) |
| Logging | Winston |

---

## Project Structure

```
backend/
  prisma/
    schema.prisma          # Database schema + migrations
  src/
    config/               # env, database (Prisma), logger, swagger
    database/
      seed.js             # Super Admin seed script
    middlewares/          # authenticate, authorize, companyScope, errorHandler, etc.
    modules/
      auth/               # Login, refresh, logout
      companies/          # Company CRUD (SUPER_ADMIN)
      users/              # User CRUD (SUPER_ADMIN + ADMIN)
    utils/                # jwt, hash, response, asyncHandler, AppError
    routes/               # Root API router
    app.js                # Express app setup
    server.js             # HTTP server + graceful shutdown
  .env.example
  package.json
  README.md
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### 2. Clone & install

```bash
cd backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and JWT secrets
```

### 4. Run database migration

```bash
npm run migrate:dev
# For production:
npm run migrate
```

### 5. Seed Super Admin

```bash
npm run seed
# Default credentials (set in .env):
#   Email:    superadmin@adpub.com
#   Password: SuperAdmin@123
```

### 6. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Endpoints

| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/login` | No | — |
| POST | `/api/auth/refresh` | No | — |
| POST | `/api/auth/logout` | Yes | Any |
| GET | `/api/companies` | Yes | SUPER_ADMIN |
| POST | `/api/companies` | Yes | SUPER_ADMIN |
| GET | `/api/companies/:id` | Yes | SUPER_ADMIN, ADMIN |
| PATCH | `/api/companies/:id` | Yes | SUPER_ADMIN |
| DELETE | `/api/companies/:id` | Yes | SUPER_ADMIN |
| GET | `/api/users` | Yes | SUPER_ADMIN, ADMIN |
| POST | `/api/users` | Yes | SUPER_ADMIN, ADMIN |
| GET | `/api/users/:id` | Yes | SUPER_ADMIN, ADMIN |
| PATCH | `/api/users/:id` | Yes | SUPER_ADMIN, ADMIN |
| DELETE | `/api/users/:id` | Yes | SUPER_ADMIN, ADMIN |
| GET | `/api/health` | No | — |

📖 **Interactive Docs:** `http://localhost:5000/api/docs`

---

## Multi-Company Architecture

This system uses **Shared Database with `company_id` column isolation**:

- One PostgreSQL database for all companies
- Every user (except SUPER_ADMIN) belongs to a `company_id`
- A `companyScope` middleware enforces isolation — ADMIN users can only see/modify data in their own company
- SUPER_ADMIN has `company_id = NULL` and bypasses all company scoping

---

## Roles & Permissions

| Role | Can Do |
|---|---|
| SUPER_ADMIN | Full access — manage companies, all users |
| ADMIN | Manage users within own company (SALES, DESIGNER, PRODUCTION only) |
| SALES | No management access yet (foundation) |
| DESIGNER | No management access yet (foundation) |
| PRODUCTION | No management access yet (foundation) |

---

## Security

- **Helmet** — HTTP security headers
- **CORS** — Configurable origin whitelist
- **Rate limiting** — 10 req/15min on auth routes, 200 req/15min globally
- **XSS protection** — `xss-clean` middleware
- **HPP** — HTTP Parameter Pollution prevention
- **Passwords** — bcryptjs with configurable rounds (default 12)
- **Refresh tokens** — stored as SHA-256 hashes, rotated on use

---

## Database ER Diagram

```
companies ──── users
    │             │
    │             ├── refresh_tokens
    │             │
    └── audit_logs (company_id nullable)
         └── (user_id nullable)
```

---

## Environment Variables

See `.env.example` for all required variables.
