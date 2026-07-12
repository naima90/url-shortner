# Security notes

This is a DevSecOps project, so security is designed in from the start rather than bolted on later. This file tracks what is already in place and what is planned.

## Already in place

- **Password hashing:** argon2, not plain text and not a fast hash.
- **Sessions:** short-lived JWT access token plus a longer refresh token. Refresh tokens are stored hashed and can be revoked, so logout and breach response actually work.
- **Cookie storage:** the session token lives in an httpOnly, Secure, SameSite cookie. Page scripts cannot read it, which limits what an XSS bug can steal.
- **Input validation:** every request body is validated with zod, using the same schemas the frontend uses.
- **Rate limiting:** strict limits on auth endpoints (blunts brute force and credential stuffing) and moderate limits on link creation (blunts spam and abuse).
- **Security headers:** helmet sets sane defaults.
- **CORS:** an explicit origin allowlist, not a wildcard, because the cookie flow needs credentials.
- **Privacy:** visitor IPs are hashed with a salt before storage. No raw IPs sit in the database.
- **Secrets hygiene:** no `.env` file is committed. Each one has a matching `.env.example` with placeholders. The API validates required secrets on boot and refuses to start if one is missing.

## Planned (later phases)

- Content Security Policy tuning once the real domains are known.
- Dependency and secret scanning in CI.
- A proper secrets manager instead of env files in production.
- Least-privilege database credentials.
- Secrets rotation.
