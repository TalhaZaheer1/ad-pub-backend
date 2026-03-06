# API Contract — Ad Publication System

> **Version:** 1.0.0 | **Base URL:** `http://localhost:5000/api`
> Shared between Backend and Frontend development teams.

---

## Response Envelope

All responses follow this structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": {} | [] | null
}
```

Validation errors include an additional `errors` array:
```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": ["Email is required.", "Password must be at least 8 characters."]
}
```

---

## Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

Access tokens expire in **15 minutes**. Use `POST /api/auth/refresh` to rotate.

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (token missing/expired) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate email/slug) |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Auth Endpoints

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "superadmin@adpub.com",
  "password": "SuperAdmin@123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "superadmin@adpub.com",
      "role": "SUPER_ADMIN",
      "companyId": null
    }
  }
}
```

---

### POST `/api/auth/refresh`

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/api/auth/logout`

Requires `Authorization: Bearer <token>`

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "success": true, "message": "Logged out successfully.", "data": null }
```

---

## Companies Endpoints

> All require `Authorization`. SUPER_ADMIN only (except GET /:id which ADMIN can also access).

### POST `/api/companies`

**Request:**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Company created successfully.",
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/api/companies`
Query params: `?isActive=true|false`

### GET `/api/companies/:id`

### PATCH `/api/companies/:id`
Body: any subset of `{ name, slug, isActive }`

### DELETE `/api/companies/:id`
Soft delete — sets `isActive: false`.

---

## Users Endpoints

> SUPER_ADMIN: full access. ADMIN: own company users only, roles limited to SALES/DESIGNER/PRODUCTION.

### POST `/api/users`

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@acme.com",
  "password": "Secure@123",
  "role": "SALES",
  "companyId": "uuid"
}
```

> `companyId` is auto-set to the ADMIN's company when the requester is an ADMIN.

**Response 201:**
```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@acme.com",
    "role": "SALES",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "...",
    "company": {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  }
}
```

### GET `/api/users`
Query params: `?companyId=uuid&isActive=true|false`

### GET `/api/users/:id`

### PATCH `/api/users/:id`
Body: any subset of `{ firstName, lastName, email, password, role, isActive }`

### DELETE `/api/users/:id`
Soft delete — sets `isActive: false`.

---

## Roles Enum

```
SUPER_ADMIN | ADMIN | SALES | DESIGNER | PRODUCTION
```

---

## IDs

All IDs are **UUIDs** (v4). Example: `"550e8400-e29b-41d4-a716-446655440000"`

---

## Frontend Integration Notes

1. Store `accessToken` in memory (not localStorage) for security.
2. Store `refreshToken` in a secure HttpOnly cookie if possible.
3. On 401 response, automatically call `/api/auth/refresh` and retry.
4. Include `Authorization: Bearer <accessToken>` on every protected request.
5. Check `user.role` from login response to conditionally render UI elements.
