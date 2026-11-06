# API & Route Reference

This document provides the definitive specification of all API routes, authentication parameters, payload schemas, and response formats implemented across **Savelo IdP**.

---

## 1. Endpoints Summary Matrix

| Method | Path | Auth / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/.well-known/openid-configuration` | Public | Standard OIDC discovery metadata document. |
| `GET` | `/api/.well-known/jwks.json` | Public | Public RSA 2048 keys for RS256 JWT signature verification. |
| `POST` | `/api/auth/initiate` | Public (Rate Limited) | Initiates Zero-Password login (OTP generation & Magic Link). |
| `POST` | `/api/auth/verify` | Public (Rate Limited) | Verifies OTP or Magic Link token and issues an auth code. |
| `GET` | `/api/auth/status` | Public (SSE) | Server-Sent Events stream for cross-device verification push. |
| `GET` | `/oauth/authorize` | Public | OIDC authorization endpoint (renders zero-password UI). |
| `GET` | `/verify` | Public | Magic Link confirmation UI (email scanner protection). |
| `POST` | `/api/oauth/token` | Client Credentials | Exchanges auth code for tokens; rotates refresh tokens. |
| `GET/POST`| `/api/oauth/userinfo` | Bearer Token | Returns user profile claims for the authenticated subject. |
| `POST` | `/api/oauth/revoke` | Public / Client | Revokes active refresh token and associated session. |
| `GET` | `/api/developer/apps` | Developer | Lists all registered OAuth client applications. |
| `POST` | `/api/developer/apps` | Developer | Provisions a new OAuth client application with credentials. |

---

## 2. OpenID Connect Discovery & Keys

### `GET /api/.well-known/openid-configuration`
Returns standard metadata describing IdP capabilities.
- **Request Headers:** None
- **Response Headers:** `Content-Type: application/json`
- **Response `200 OK`:**
```json
{
  "issuer": "https://auth.savelo.web.id",
  "authorization_endpoint": "https://auth.savelo.web.id/oauth/authorize",
  "token_endpoint": "https://auth.savelo.web.id/api/oauth/token",
  "userinfo_endpoint": "https://auth.savelo.web.id/api/oauth/userinfo",
  "jwks_uri": "https://auth.savelo.web.id/api/.well-known/jwks.json",
  "revocation_endpoint": "https://auth.savelo.web.id/api/oauth/revoke",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email", "phone"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
  "code_challenge_methods_supported": ["S256"]
}
```

---

### `GET /api/.well-known/jwks.json`
Exports public RSA JSON Web Keys.
- **Response `200 OK`:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "savelo-idp-key-1",
      "n": "u1wK_...<modulus>...",
      "e": "AQAB"
    }
  ]
}
```

---

## 3. Zero-Password Authentication Routes

### `POST /api/auth/initiate`
Dispatches an OTP and generates a Magic Link. Enforces anti-enumeration constant latency (~300ms).

- **Rate Limit:** 5 requests / 15 minutes per IP + identifier.
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "identifier": "engineer@savelo.com",
  "clientId": "savelo-tools",
  "redirectUri": "https://tools.savelo.web.id/api/auth/callback",
  "codeChallenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "codeChallengeMethod": "S256",
  "state": "xyz123",
  "scope": "openid profile email"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "sessionStateID": "9c824c13-7ff6-4ad9-a78c-f0cf3d32b509",
  "magicLinkUrl": "https://auth.savelo.web.id/verify?token=...&session_state_id=...",
  "message": "Authentication initiated. Please check your email or phone."
}
```
- **Error Responses:**
  - `400 Bad Request`: `{ "error": "invalid_client", "error_description": "Client does not exist." }`
  - `429 Too Many Requests`: `{ "error": "rate_limit_exceeded", "error_description": "Too many requests. Please wait." }`

---

### `POST /api/auth/verify`
Validates an OTP or Magic Link token. Auto-provisions user on first success.

- **Content-Type:** `application/json`
- **Request Body (OTP Verification):**
```json
{
  "sessionStateID": "9c824c13-7ff6-4ad9-a78c-f0cf3d32b509",
  "otp": "492817"
}
```
- **Request Body (Magic Link Verification):**
```json
{
  "sessionStateID": "9c824c13-7ff6-4ad9-a78c-f0cf3d32b509",
  "magicLinkToken": "35a8bc9447477d9c669145610ec1fba05a413d8d..."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "authCode": "c4820a9bf50284eb3b7a5e9821d30bf7",
  "redirectUri": "https://tools.savelo.web.id/api/auth/callback?code=c4820a9bf50284eb3b7a5e9821d30bf7&state=xyz123"
}
```
- **Error Responses:**
  - `400 Bad Request`: `{ "error": "invalid_credentials", "error_description": "Incorrect OTP. 2 attempts remaining." }`
  - `429 Too Many Requests`: `{ "error": "max_attempts_exceeded", "error_description": "Too many failed attempts." }`

---

### `GET /api/auth/status`
Server-Sent Events (SSE) stream for real-time cross-device verification push.

- **Query Parameters:** `session_state_id=<UUID>`
- **Response Headers:**
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- **Event Stream Output:**
```
data: {"isVerified":true,"authCode":"c4820a9bf50284eb3b7a5e9821d30bf7"}
```

---

## 4. OAuth 2.0 & Token Routes

### `POST /api/oauth/token`
Exchanges authorization codes and handles refresh token rotations. Accepts `application/x-www-form-urlencoded` or `application/json`.

#### A. Authorization Code Exchange
- **Request Parameters:**
```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=savelo-tools&
client_secret=savelo_sec_...&
code=c4820a9bf50284eb3b7a5e9821d30bf7&
redirect_uri=https%3A%2F%2Ftools.savelo.web.id%2Fapi%2Fauth%2Fcallback&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```
- **Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "8df90b34...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

#### B. Refresh Token Exchange (with RTR)
- **Request Parameters:**
```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
client_id=savelo-tools&
client_secret=savelo_sec_...&
refresh_token=8df90b34...
```
- **Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "92ea407c...",
  "token_type": "Bearer",
  "expires_in": 900
}
```
- **Breach Response `400 Bad Request`:**
```json
{
  "error": "invalid_grant",
  "error_description": "TOKEN_COMPROMISED: Token reuse detected. All sessions in this family have been terminated."
}
```

---

### `GET /api/oauth/userinfo`
Fetches user claims for the authenticated subject.
- **Request Headers:** `Authorization: Bearer <access_token>`
- **Response `200 OK`:**
```json
{
  "sub": "b2f698d2-45e0-4a8b-9679-d5952f1e29cb",
  "email": "engineer@savelo.com",
  "email_verified": true,
  "phone": "+628123456789"
}
```
- **Response `401 Unauthorized`:**
```json
{
  "error": "invalid_token",
  "error_description": "Access token is invalid or expired."
}
```

---

### `POST /api/oauth/revoke`
RFC 7009 token revocation.
- **Request Body:**
```json
{
  "token": "8df90b34...",
  "token_type_hint": "refresh_token"
}
```
- **Response `200 OK`:**
```json
{
  "status": "revoked"
}
```

---

## 5. Developer Management Routes

### `GET /api/developer/apps`
Lists registered client applications.
- **Response `200 OK`:**
```json
{
  "success": true,
  "clients": [
    {
      "id": "2da14476-c5fb-4293-86ee-777f9feff998",
      "name": "Savelo Tools",
      "clientId": "savelo-tools",
      "redirectUris": ["https://tools.savelo.web.id/api/auth/callback"],
      "createdAt": "2026-11-04T08:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/developer/apps`
Registers a new client application and returns client credentials.
- **Request Body:**
```json
{
  "name": "Saveroute Dispatch API",
  "redirectUris": ["https://route.savelo.web.id/api/auth/callback"]
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "client": {
    "id": "e6a0efbf-ef3d-4c3e-862d-0bfe695c0f75",
    "name": "Saveroute Dispatch API",
    "clientId": "saveroute-dispat-3f82aa",
    "redirectUris": ["https://route.savelo.web.id/api/auth/callback"],
    "createdAt": "2026-11-06T08:30:00.000Z"
  },
  "plainSecret": "savelo_sec_019a28b4c09d57a24e9301bf"
}
```
*(Notice: `plainSecret` is displayed only once and cannot be recovered).*

---

## 6. SCIM v2.0 Identity Management Routes (RFC 7643 / RFC 7644)

All SCIM routes require server-to-server authentication using the client's SCIM Bearer token:
`Authorization: Bearer <client_scim_token>`

### `GET /api/scim/v2/ServiceProviderConfig`
Returns metadata describing Savelo IdP's SCIM capabilities.
- **Content-Type:** `application/scim+json; charset=utf-8`
- **Response `200 OK`:** RFC 7644 ServiceProviderConfig JSON.

---

### `GET /api/scim/v2/Users`
Lists users provisioned for the authenticated client app.
- **Query Parameters:**
  - `startIndex`: 1-based start index (default `1`)
  - `count`: Maximum items to return (default `20`, max `100`)
  - `filter`: Basic filter string, e.g. `userName eq "john@example.com"` or `active eq true`
- **Response `200 OK`:**
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 1,
  "startIndex": 1,
  "itemsPerPage": 1,
  "Resources": [
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
      "id": "e4eaaaf2-d142-11e1-b3e4-080027620cdd",
      "userName": "john.doe@abccorp.com",
      "name": {
        "formatted": "John Doe",
        "givenName": "John",
        "familyName": "Doe"
      },
      "emails": [{ "value": "john.doe@abccorp.com", "type": "work", "primary": true }],
      "phoneNumbers": [{ "value": "+628123456789", "type": "work" }],
      "active": true,
      "meta": {
        "resourceType": "User",
        "created": "2026-11-01T10:00:00.000Z",
        "lastModified": "2026-11-05T12:00:00.000Z",
        "location": "/api/scim/v2/Users/e4eaaaf2-d142-11e1-b3e4-080027620cdd"
      }
    }
  ]
}
```

---

### `POST /api/scim/v2/Users`
Provisions a new user under the authenticated client.
- **Request Body:** SCIM User payload (contains `userName`, `name`, `emails`, `phoneNumbers`, `active`).
- **Response `201 Created`:** The created SCIM User Resource with `Location` header.

---

### `GET /api/scim/v2/Users/{id}`
Retrieves a single user resource by ID, enforcing tenant isolation.
- **Response `200 OK`:** SCIM User Resource.
- **Response `404 Not Found`:** SCIM Error message if user is not found or not linked to the calling client.

---

### `PATCH /api/scim/v2/Users/{id}`
Applies partial updates (RFC 7644 PatchOp), including deactivation (`active: false`).
- **Request Body:**
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    {
      "op": "replace",
      "path": "active",
      "value": false
    }
  ]
}
```
- **Response `200 OK`:** Updated SCIM User Resource. If deactivated, active user sessions for the client are invalidated immediately.

---

### `DELETE /api/scim/v2/Users/{id}`
Deprovisions and unlinks the user from the client app.
- **Response `204 No Content`:** User successfully unlinked from client and client sessions revoked.

