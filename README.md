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
2. **Application tier** (`apps/api`): an Express API. All the logic: auth, shortening, redirects, and analytics.
3. **Data tier** (PostgreSQL via Prisma): stores users, links, and click events.

There is also a shared package (`packages/shared`) that holds the types and validation rules both the frontend and backend use, so the two never drift apart.

```
url-shortner/
├── apps/
│   ├── web/        Next.js frontend
│   └── api/        Express API + Prisma
└── packages/
    └── shared/     Types + zod validation shared by both
```

## Getting started

You need Node 20+ and a PostgreSQL database. If you have Docker, the helper script below starts one for you.

```bash
# 1. Install everything (npm workspaces links the packages together)
npm install

# 2. Start a local Postgres (needs Docker). Skip if you already have one.
npm run db:start

# 3. Copy the example env files and fill in the blanks
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 4. Create the database tables
npm run migrate --workspace=apps/api

# 5. Run the API and the web app together
npm run dev
```

The API runs on http://localhost:4000 and the web app on http://localhost:3000.

## Testing

```bash
# Backend unit + integration tests (Jest + Supertest)
npm run test --workspace=apps/api

# End-to-end browser tests (Playwright)
npm run test:e2e --workspace=apps/web
```

## Notes on security

A few choices worth calling out, since this is a DevSecOps project:

- Passwords are hashed with argon2.
- The login session lives in an httpOnly cookie, so page scripts cannot read the token.
- Visitor IPs are hashed before they are stored, so no raw personal data sits in the database.
- Auth and link-creation endpoints are rate limited.
- Secrets never get committed. Every `.env` has a matching `.env.example` with placeholders.

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md` for more.
