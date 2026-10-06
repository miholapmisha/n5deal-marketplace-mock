@AGENTS.md

# N5Deal Marketplace — Claude Code guide

M&A marketplace prototype (Buyer / Seller / Platform Manager). **`SPEC.md` is the source of
truth.** If a decision changes, update `SPEC.md` first, then the code.

## Commands

```bash
npm run dev         # dev server, http://localhost:3000
npm run build       # production build (run before every milestone commit)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (flat config, eslint-config-next)
npm run db:up       # local Postgres 17 in Docker, port 5433 (container n5deal_postgres)
npm run db:migrate  # prisma migrate dev — after editing prisma/schema.prisma
npm run db:seed     # TRUNCATES all tables, then re-inserts deterministic demo data
npx prisma generate # regenerate the client (migrate dev does NOT do this in Prisma 7)
npm test            # Vitest unit tests (tests/unit), no DB or API key needed
npm run test:e2e    # Playwright flows (tests/e2e); RESEEDS the local DB before and after
```

Port 5432 belongs to another project's container (`orchestrator_postgres`) — never touch
it. The e2e run reuses a dev server already on :3000 and refuses to seed a non-local host.
Unit tests import `src/server` modules directly: Vitest aliases `server-only` to its no-op
build (`vitest.config.mts`).

## Stack

Next.js 16.3 App Router · React 19 + React Compiler · TypeScript strict · Tailwind v4
(CSS-first config in `src/app/globals.css`, no `tailwind.config.*`) · shadcn/ui (Radix,
"nova" preset; add components with `npx shadcn@latest add <name>`) · Prisma 7 +
PostgreSQL (Neon) · Zod 4 · bcryptjs · Google Gen AI SDK (`@google/genai`, Gemini) · Vitest ·
Playwright · Vercel.
Package manager: **npm**.

Next.js 16 differs from older versions: `middleware.ts` is now `proxy.ts`; `params` and
`searchParams` are Promises. Check `node_modules/next/dist/docs/` before using an API you
are unsure of. A page that reads the DB but no request data must `await connection()`
(from `next/server`), or it is prerendered once at build time.

Prisma 7 differs too: config lives in `prisma.config.ts` (loads `.env` via dotenv); the
client is generated to `src/generated/prisma` (gitignored) and imported from
`@/generated/prisma/client`; client-safe enums from `@/generated/prisma/enums`; the
connection goes through `@prisma/adapter-pg`. Import the app's client only from
`@/server/db`. The CLI prefers `DATABASE_URL_UNPOOLED` (direct) over `DATABASE_URL`
(pooled). Prisma CLI is pinned to 7.10.0: npm's `latest` tag points at an 8.0 RC.

Theme tokens (sampled from n5deal.com) live in `src/app/globals.css`: `primary` #383bfe,
`success` #059669, `row` / `row-border` for label–value rows, `pill` for active tabs,
`shadow-card`. Use these tokens, not raw hex values.

## Code style

No comments in code (TS/TSX, Prisma schema, CSS): no JSDoc, file headers, or SPEC
references. Put the reasoning in names, `README.md`, or `SPEC.md`.

## Architecture rules (SPEC §6)

- `src/app/` holds routes only. Business logic lives in `src/server/`; every file there
  starts with `import 'server-only'`.
- Feature modules use four files: `*.schema.ts` (Zod) → `*.actions.ts` (server actions) →
  `*.service.ts` (authorization + rules) → `*.repo.ts` (Prisma only).
- **Reads:** Server Components call services directly — never internal HTTP.
- **Writes:** server action → Zod parse → service → repo → `revalidatePath`.
- **Authorization is enforced in services.** `proxy.ts` only redirects for UX.
- Visibility rules live in `src/server/policies/` as pure functions + Prisma `where`
  builders. Visibility is derived at query time; never mutate assets on user suspension.
- `matchScore` (`src/server/matching/`) is pure and used both buyer→asset and seller→buyer.
- Money is whole euros in `Int`. No floats.
- Filter state lives in the URL; parse `searchParams` with Zod and drop invalid values.
- The only route handler is `src/app/api/ai-search/route.ts`.

## Milestone workflow

Work milestone by milestone (SPEC §12: M0 → M9). For each milestone:

1. Implement only that milestone's scope.
2. Verify its "Done when" criterion; `npm run build` and `npm run lint` must pass.
3. Commit (conventional commits, e.g. `feat(m3): catalog filters in URL`).
4. **Write the phase doc** (below) as the last step.

## Phase docs (local only, gitignored)

At the **end** of every milestone, create `phase-docs/M<n>-<short-slug>.md` (e.g.
`phase-docs/M1-foundation-and-deploy.md`). The folder is in `.gitignore`; never commit it.
These are personal learning notes for the developer, so write them to teach, not to log.
Each file has these sections:

1. **Reason** — why this phase exists, what problem it solves, and why it comes at this
   point in the order.
2. **Mental model** — the picture to keep in your head: how the pieces fit, data/request
   flow, diagrams in ASCII where useful.
3. **Tech theory** — the concepts used in this phase, explained from first principles
   (e.g. RSC vs client components, session hashing, facet counts), with trade-offs and
   alternatives that were rejected.
4. **What was built** — files and decisions, briefly.
5. **Pitfalls & gotchas** — what broke or nearly broke, and how to recognize it next time.

## Progress

- [x] M0 — Next.js scaffold, git, README skeleton, CLAUDE.md
- [x] M1 — Tailwind + shadcn, Prisma schema, Neon, seed, Vercel deploy (https://n5deal-marketplace-mock.vercel.app)
- [x] M2 — Sessions, register/login, demo login, guards, `/suspended`
- [x] M3 — Catalog + detail + URL filters + facet counts
- [x] M4 — Asset form, my assets, buyer profile
- [x] M5 — Messaging + contact flows (S2, S4 → S2, S9 buyer detail)
- [x] M6 — Buyer directory + match score (S8, Rank for, S3 best match, S9 fit)
- [x] M7 — Manager + moderation (S10, S11, hide/remove on S4)
- [x] M8 — AI search + fallback (Gemini 3.5 Flash-Lite, DB rate limit)
- [x] M9 — Tests, README final, polish

## Deployment

GitHub `miholapmisha/n5deal-marketplace-mock` → Vercel (auto-deploys on push to `main`).
`vercel.json` pins the build to `npm run vercel-build` (`prisma migrate deploy && next build`).
Neon is connected through the Vercel integration (`DATABASE_URL` pooled,
`DATABASE_URL_UNPOOLED` direct). Seeding production is manual and destructive — the
developer runs it from their own terminal; never put Neon credentials in this repo or chat.
