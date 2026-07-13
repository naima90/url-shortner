# Architecture

This project is a 3-tier web application. Each tier has one job and talks to the next through a clear boundary. The application tier is itself split into two processes — an API and a worker — connected by a queue.

```
Browser
   │
   ▼
Presentation tier   apps/web     Next.js (App Router). Pages, forms, dashboard.
   │  HTTP (fetch, cookie attached)
   ▼
Application tier    apps/api     Express. Auth, shortening, redirects, analytics reads.
   │  │  Prisma (via packages/db)      │  cache-aside + shared rate-limit store
   │  ▼                                ▼
   │ PostgreSQL  Users, links, click events        Redis
   │
   │  publishes a click event (fire-and-forget)
   ▼
   SQS (click-events queue)
   │
   ▼
Application tier    apps/worker  Consumes the queue, writes ClickEvent rows.
   │  Prisma (via packages/db)
   ▼
Data tier           PostgreSQL   (same database as above)
```

## Why it is split this way

- The frontend never touches the database. It only calls the API.
- The API and worker hold all the logic and are the only things that talk to Postgres.
- Swapping one tier (say, a different frontend) does not force changes in the others.
- The API and worker are split so a slow or briefly-unavailable database can't slow down or drop redirects — see "The redirect path" below.

## Backend layering

Inside `apps/api` (and, for the parts it needs, `apps/worker`), requests flow one direction only:

```
routes        which URL, which middleware
  → controllers   read the request, call a service, shape the response
    → services      the actual business logic and rules
      → repositories  the only code that talks to Prisma / the database
```

Because services never import Express or Prisma, they are pure logic and easy to unit test with mocked repositories. Repositories are the single place the ORM appears, so the database layer is swappable.

The repositories, Prisma schema, and Prisma client itself live in `packages/db`, not in `apps/api`. `apps/worker` needs the exact same data access (it writes `ClickEvent` rows through `clickRepository`) without duplicating the schema, so both apps depend on `packages/db` as their only way to reach Postgres. Business-rule services (`link.service.ts`, `analytics.service.ts`, `auth.service.ts`) stay in `apps/api`, since ownership checks, alias rules, and auth logic are API concerns, not data-access concerns.

## Shared validation

`packages/shared` holds the DTO types and zod schemas. Both the frontend forms and the backend routes validate against the same schemas, so client and server rules never drift apart. This is the "single source of truth for input validation" idea.

## The redirect path

Short links like `https://short.example/abc123` are served directly by the Express API, not proxied through Next.js. The redirect is a hot, unauthenticated path, so it's optimized in two ways:

- **Code lookup is cache-aside through Redis.** `apps/api` checks Redis for `link:<code>` first; on a miss it falls back to Postgres and populates the cache with a 5-minute TTL. Deleting a link invalidates its cache entry immediately, so a deleted link doesn't keep redirecting until the TTL expires.
- **Click recording is asynchronous.** Instead of writing the `ClickEvent` row inline, the API hashes the visitor's IP (never storing it raw) and publishes a message to the click-events SQS queue, then immediately returns the 302. `apps/worker` is a separate long-polling consumer that does the actual Postgres write and deletes the message once it succeeds; a failed write leaves the message in the queue to retry. This means a slow or briefly-down database no longer slows or drops redirects — worst case, click recording lags behind, it doesn't block.

A failed publish is logged but never blocks the redirect, same as the old synchronous write used to be wrapped.

## Decisions log

- Monorepo with npm workspaces, no Turborepo/Nx (kept the tooling simple).
- Prisma over raw SQL for type-safe queries and easy migrations.
- Prisma schema/client/repositories extracted into `packages/db` once a second app (`apps/worker`) needed the same data access, rather than duplicating it.
- Click recording decoupled from the redirect request via SQS + a dedicated worker, so redirect latency and availability don't depend on Postgres.
- Redis added for two things: a cache-aside on the redirect's code lookup, and a shared store for rate limiting (an in-memory store would count per-process once more than one API instance is running).
- argon2 for password hashing (memory-hard, OWASP-recommended default).
- JWT access token (short-lived) plus a hashed, revocable refresh token.
- Session token in an httpOnly cookie, not localStorage, to limit XSS token theft.
- Single `code` namespace for both auto-generated codes and custom aliases, to avoid cross-domain collision logic.
