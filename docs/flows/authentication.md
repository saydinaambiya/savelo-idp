# Zero-Password Authentication Lifecycle

This document describes the end-to-end lifecycle of the Zero-Password authentication engine in **Savelo IdP**, covering OTP generation, Magic Link processing, scanner evasion, and cross-device Server-Sent Events (SSE) synchronization.

---

## 1. High-Level Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Desktop Browser)
    participant ClientApp as Client Application
    participant IdP as Savelo IdP Server
    participant Redis as Redis Cache & PubSub
    actor Mobile as User (Mobile / Email Client)

    User->>ClientApp: Clicks "Sign in with Savelo"
    ClientApp->>IdP: Redirects to /oauth/authorize (with PKCE challenge)
    IdP-->>User: Renders login form
    User->>IdP: Submits email/phone to POST /api/auth/initiate
    IdP->>Redis: Saves AuthRequestState (10 min TTL)
    IdP-->>User: Returns sessionStateID; opens SSE to /api/auth/status
    IdP-->>Mobile: Dispatches OTP (SMS) & Magic Link (Email)

    alt Scenario A: Verification on Desktop
        User->>IdP: Submits 6-digit OTP to POST /api/auth/verify
        IdP->>Redis: Validates HMAC-SHA256 hash & marks verified
        IdP-->>User: Redirects with authorization_code to ClientApp callback
    else Scenario B: Cross-Device Magic Link on Mobile
        Mobile->>IdP: Opens /verify?token=...&session_state_id=...
        Mobile->>IdP: Clicks "Confirm Login" (POST /api/auth/verify)
        IdP->>Redis: Publishes event to auth:events:{sessionStateID}
        Redis-->>User: SSE pushes { isVerified: true, authCode: "..." }
        User->>ClientApp: Desktop automatically redirects to callback URL
    end
```

---

## 2. Phase 1: Authentication Initiation (`POST /api/auth/initiate`)

1. **Parameter Inspection:**
   - Client sends `identifier` (email or phone), `clientId`, `redirectUri`, `codeChallenge`, `codeChallengeMethod`, and optional `state`/`nonce`.
2. **Rate Limit Verification:**
   - Evaluates Redis key `rl:initiate:{ip}:{identifier}` against a sliding window threshold (maximum 5 requests per 15 minutes).
3. **Client App Whitelist Validation:**
   - Checks if `clientId` exists in PostgreSQL.
   - If `redirectUri` is supplied, validates that it strictly matches `client.redirectUris`.
4. **Cryptographic Generation:**
   - Generates 6-digit numeric OTP via `crypto.randomInt(100000, 1000000)`.
   - Generates 32-byte cryptographically secure random token for Magic Link.
   - Computes `otpHash = HMAC-SHA256(rawOtp, AUTH_PEPPER_SECRET)`.
   - Computes `magicLinkHash = SHA256(rawMagicToken)`.
5. **State Storage in Redis:**
   - Key: `auth:req:{sessionStateID}` with a 600-second (10-minute) TTL.
6. **Anti-Enumeration Latency Normalization:**
   - The entire initiate operation is wrapped in `withConstantLatency(fn, 300)` to ensure timing consistency regardless of whether the user previously exists in the database.
7. **Response:**
   - Returns `{ sessionStateID, magicLinkUrl, message: "Authentication initiated" }`.

---

## 3. Phase 2: Verification & Anti-Brute Force (`POST /api/auth/verify`)

The verification endpoint accepts either a 6-digit OTP or a Magic Link token:

1. **State Retrieval & Expiration Check:**
   - Fetches `AuthRequestState` from Redis. If absent, responds with `400 Bad Request (CHALLENGE_EXPIRED)`.
2. **Brute Force Counter:**
   - If `attempts >= 3`, deletes the challenge from Redis and rejects the request with `429 Too Many Requests (MAX_ATTEMPTS_EXCEEDED)`.
3. **Constant-Time Verification:**
   - **For OTP:** Computes `HMAC-SHA256(providedOtp, AUTH_PEPPER_SECRET)` and checks `timingSafeStringEqual(computedHash, storedOtpHash)`.
   - **For Magic Link:** Computes `SHA256(providedToken)` and checks `timingSafeStringEqual(computedHash, storedMagicLinkHash)`.
4. **Failure Handling:**
   - On mismatch, increments `attempts` counter in Redis and returns `400 Bad Request (INVALID_CREDENTIALS)` with remaining attempt count.
5. **Success & Auto-Provisioning:**
   - User account is fetched or automatically provisioned in PostgreSQL via `userRepository.autoProvision(identifier)`.
6. **Authorization Code Generation:**
   - Generates a 32-character single-use authorization code (`authCode`).
   - Saves code data in Redis (`auth:code:{authCode}`) with a short TTL (180 seconds).
   - Marks `state.isVerified = true` in Redis.
7. **Cross-Device Event Broadcast:**
   - Publishes `{ isVerified: true, authCode }` to Redis Pub/Sub channel `auth:events:{sessionStateID}`.

---

## 4. Phase 3: Cross-Device Synchronization (`GET /api/auth/status`)

To provide seamless cross-device authentication (e.g. logging into a desktop browser by clicking a magic link on a smartphone):

1. **Connection Setup:**
   - The initiating browser subscribes to Server-Sent Events (SSE) at `GET /api/auth/status?session_state_id={sessionStateID}`.
   - The route configures HTTP response headers:
     ```http
     Content-Type: text/event-stream
     Cache-Control: no-cache, no-transform
     Connection: keep-alive
     ```
2. **Pub/Sub Listener:**
   - A dedicated Redis subscriber listens on `auth:events:{sessionStateID}`.
3. **Instant Event Dispatch:**
   - As soon as the mobile device completes verification, the subscriber receives the message and immediately pushes:
     ```text
     data: {"isVerified": true, "authCode": "auth_code_xyz123"}
     ```
4. **Client-Side Redirection:**
   - The initiating page receives the event and performs an immediate top-level browser redirect to:
     ```
     {redirectUri}?code={authCode}&state={clientState}
     ```

---

## 5. Phase 4: Email Scanner Evasion (`app/verify/page.tsx`)

Enterprise email firewalls and anti-phishing gateways often execute automated HTTP GET requests on incoming links to inspect landing pages:

- **Evasion Mechanism:** The Magic Link URL points to `GET /verify?token=...&session_state_id=...`.
- The GET request serves an interactive confirmation page without validating or consuming the token.
- The user must click an explicit **"Confirm Login"** button, which triggers an HTTP `POST /api/auth/verify`.
- This ensures scanners cannot prematurely consume or invalidate the one-time authentication token.
