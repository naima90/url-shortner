# url-shortner

A small URL shortener you can run end to end. Paste a long link, get a short one, and track how many times it gets clicked. It is built as a DevSecOps portfolio project, so the structure and security choices matter as much as the feature set.

## What it does

- Sign up, log in, and manage your own links from a dashboard.
- Shorten any URL, with an auto-generated code or your own custom alias.
- Redirect short links to their destination and record each click.
- See click counts and a per-link history.

## The 3 tiers

This is a classic 3-tier app, split into three parts:

1. **Presentation tier** (`apps/web`): a Next.js app. The pages, forms, and dashboard.
2. **Application tier** (`apps/api` + `apps/worker`): an Express API for auth, shortening, redirects, and analytics reads, plus a small worker that consumes click events off a queue and writes them to Postgres.
3. **Data tier** (PostgreSQL via Prisma, plus Redis): Postgres stores users, links, and click events; Redis backs the shared rate limiter and caches the hot redirect lookup.

Click recording doesn't happen inline with the redirect: `apps/api` publishes a click event to a queue and returns the redirect immediately, and `apps/worker` does the actual database write. This keeps the redirect fast and keeps a slow/unavailable database from blocking redirects at all (see `docs/ARCHITECTURE.md`).

There are two shared packages: `packages/shared` holds the DTO types and zod validation rules both the frontend and backend use, and `packages/db` holds the Prisma schema, client, and repositories shared by `apps/api` and `apps/worker`.

```
url-shortner/
├── apps/
│   ├── web/        Next.js frontend
│   ├── api/        Express API (auth, shortening, redirects, analytics reads)
│   └── worker/     Consumes click events from the queue, writes them to Postgres
└── packages/
    ├── shared/     Types + zod validation shared by web and api
    └── db/         Prisma schema, client, and repositories shared by api and worker
```

## Getting started

You need Node 20+, a PostgreSQL database, and Redis. If you have Docker, you can start both locally:

```bash
# 1. Install everything (npm workspaces links the packages together)
npm install

# 2. Start a local Postgres (needs Docker). Skip if you already have one.
npm run db:start

# Start a local Redis too, e.g.:
docker run -d --name url-shortner-redis -p 6379:6379 redis:7-alpine

# 3. Copy the example env files and fill in the blanks
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.local.example apps/web/.env.local

# 4. Create the database tables (schema lives in packages/db, shared by api and worker)
npm run migrate --workspace=packages/db

# 5. Run the web app, API, and worker together
npm run dev
```

The API runs on http://localhost:4000 and the web app on http://localhost:3000. The worker has no HTTP surface — it just polls the queue.

Note: click events are published to SQS and processed asynchronously by the worker, so this also needs a queue to point `CLICK_EVENTS_QUEUE_URL` at (a real SQS queue, or a local SQS-compatible emulator). There's no local emulator wired up yet — that lands with the Docker/Terraform work.

## Testing

```bash
# Backend unit + integration tests (Jest + Supertest) - needs local Postgres and Redis running
npm run test --workspace=apps/api

# Worker unit tests (repository is mocked, no real queue or database needed)
npm run test --workspace=apps/worker

# End-to-end browser tests (Playwright)
npm run test:e2e --workspace=apps/web
```

## Notes on security

A few choices worth calling out, since this is a DevSecOps project:

- Passwords are hashed with argon2.
- The login session lives in an httpOnly cookie, so page scripts cannot read the token.
- Visitor IPs are hashed before they are stored, so no raw personal data sits in the database.
- Auth and link-creation endpoints are rate limited, backed by Redis so limits hold across multiple API instances, not just one process.
- Secrets never get committed. Every `.env` has a matching `.env.example` with placeholders.

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md` for more.
