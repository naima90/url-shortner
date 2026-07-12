# Architecture

This project is a 3-tier web application. Each tier has one job and talks to the next through a clear boundary.

```
Browser
   │
   ▼
Presentation tier   apps/web    Next.js (App Router). Pages, forms, dashboard.
   │  HTTP (fetch, cookie attached)
   ▼
Application tier    apps/api    Express. Auth, shortening, redirects, analytics.
   │  Prisma
   ▼
Data tier           PostgreSQL  Users, links, click events.
```

## Why it is split this way

- The frontend never touches the database. It only calls the API.
- The API holds all the logic and is the only thing that talks to Postgres.
- Swapping one tier (say, a different frontend) does not force changes in the others.

## Backend layering

Inside `apps/api`, requests flow one direction only:

```
routes        which URL, which middleware
  → controllers   read the request, call a service, shape the response
    → services      the actual business logic and rules
      → repositories  the only code that talks to Prisma / the database
```

Because services never import Express or Prisma, they are pure logic and easy to unit test with mocked repositories. Repositories are the single place the ORM appears, so the database layer is swappable.

## Shared validation

`packages/shared` holds the DTO types and zod schemas. Both the frontend forms and the backend routes validate against the same schemas, so client and server rules never drift apart. This is the "single source of truth for input validation" idea.

## The redirect path

Short links like `https://short.example/abc123` are served directly by the Express API, not proxied through Next.js. The redirect is a hot, unauthenticated path, and keeping it in the API means the click write lands right next to the lookup. On each hit the API records a click event, then returns a 302 to the original URL. A failed analytics write is logged but never blocks the redirect.

## Decisions log

- Monorepo with npm workspaces, no Turborepo/Nx (kept the tooling simple).
- Prisma over raw SQL for type-safe queries and easy migrations.
- argon2 for password hashing (memory-hard, OWASP-recommended default).
- JWT access token (short-lived) plus a hashed, revocable refresh token.
- Session token in an httpOnly cookie, not localStorage, to limit XSS token theft.
- Single `code` namespace for both auto-generated codes and custom aliases, to avoid cross-domain collision logic.
