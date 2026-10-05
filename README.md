# N5Deal Marketplace Prototype

A working M&A marketplace prototype for licensed financial businesses (banks, fintechs,
payment institutions, EMIs, crypto/CASP). Three roles — **Buyer**, **Seller**, and
**Platform Manager** — share one Next.js app with persistent state and seeded demo data.

Visual reference: [n5deal.com/all-listing](https://n5deal.com/all-listing). The full build
spec lives in [`SPEC.md`](./SPEC.md); it is the source of truth and changes before the code
does.

> **Status:** M1 — foundation (database, seed, catalog list, deploy). Sections marked
> _TBD_ are filled in by later milestones.

---

## Live demo

- **Deployed URL:** _TBD (M1)_
- **Demo accounts** (one-click login on `/login`, password shown under the cards):

  | Role | Email | What it shows |
  |---|---|---|
  | Buyer | `buyer@demo.n5deal` | PE fund, complete profile, 2 conversations |
  | Seller | `seller@demo.n5deal` | 4 assets (3 published, 1 draft), 1 conversation |
  | Manager | `manager@demo.n5deal` | Moderation of all participants and assets |

---

## Launch locally

Requirements: Node.js 20+, npm, and Docker (or any PostgreSQL 15+ database).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # defaults point at the Docker database below
npm run db:up               # PostgreSQL 17 in Docker on port 5433
npx prisma migrate deploy   # create the schema
npm run db:seed             # wipe and re-create the demo data (deterministic)
npm run dev                 # http://localhost:3000
```

Demo password for every seeded account: `n5deal-demo`.

| Script | What it does |
|---|---|
| `npm run db:migrate` | Create and apply a new migration after editing `prisma/schema.prisma` |
| `npm run db:reset` | Drop everything and re-apply migrations, then run `npm run db:seed` |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint checks |

---

## Assumptions

1. **One account = one role.** Buyers and Sellers register themselves; Platform Managers
   are seeded only.
2. **The asset catalog is public** (as on n5deal.com). Contacting a seller requires a Buyer
   account.
3. **The buyer directory is private** — visible to Sellers and Managers only. Buyers'
   acquisition plans are commercially sensitive.
4. **Sellers stay anonymous** on listings ("Verified seller") until a conversation starts.
   n5deal.com shows `Seller: N/A` for the same reason.
5. **"Contact" means an in-app conversation** tied to one asset, not an email. It keeps
   history, allows moderation, and prevents duplicate threads.
6. **All prices are in EUR**, stored as whole euros. No currency switcher.
7. **Managers moderate accounts and listings**; they do not read private conversations in
   this prototype.
8. **Out of scope:** payments, documents/NDAs, file uploads, and email notifications.

---

## Key technical decisions

### One Next.js app, layered like NestJS

One deploy, types shared end to end, no CORS or cross-domain cookies, and it matches
N5Deal's move to Next.js/TypeScript. The `server/` folder mirrors NestJS layering without
the framework, so services can move into a standalone backend later without a rewrite.

| Layer | File | NestJS equivalent |
|---|---|---|
| Input validation | `*.schema.ts` (Zod) | DTO + class-validator |
| Data access | `*.repo.ts` (Prisma only) | Repository |
| Business rules + authorization | `*.service.ts` | Provider |
| Entry point from forms | `*.actions.ts` (server actions) | Controller |
| Auth checks | `auth/guards.ts` | Guards |

```
src/
  app/          routes only: pages, layouts, loading/error files
  server/       server-only code: db, auth, policies, feature modules, matching, ai-search
  components/   UI; AssetCard is shared by the catalog, detail page, and asset form
  lib/          formatters (price, country flag), URL ⇄ filter parsing
prisma/         schema.prisma, seed.ts
```

### Data flow

- **Reads:** Server Components call services directly — no internal HTTP.
- **Writes:** server action → Zod parse → service (authorization + rules) → repo →
  `revalidatePath`.
- **The only route handler** is `POST /api/ai-search`.

### Authorization lives in services, not in `proxy.ts`

`proxy.ts` (named `middleware.ts` before Next.js 16) only redirects for UX. Every rule in
the permission matrix is enforced in the service layer. Reason: CVE-2025-29927 showed that
checks living only in Next.js middleware can be bypassed.

### Database sessions instead of JWTs

A random 32-byte token in an `httpOnly`, `Secure`, `SameSite=Lax` cookie; the database
stores only its SHA-256 hash. `getCurrentUser()` is wrapped in React `cache()` so it runs
once per request and rejects any user who is not `ACTIVE`. Suspending a user deletes their
sessions, so the effect is immediate — a JWT would stay valid until it expires. Passwords
use bcrypt (cost 10) via the pure-JS `bcryptjs`, so there is no native build step on Vercel.

### Derived visibility

Suspending a seller does **not** mutate their assets. Visibility is computed at query time
(`asset.status = PUBLISHED` **and** `seller.status = ACTIVE`), so reinstating a seller
restores everything with no data repair. The rules live in `server/policies/` as pure
functions plus matching Prisma `where` builders.

### Whole-euro prices

`priceEur` is an `Int` (max ~€2.1B): no floating-point money and no BigInt serialization
issues.

### PostgreSQL arrays

`categories`, `countries`, `otherLicenses`, and `benefits` are PostgreSQL array columns.
Moving to MySQL (N5Deal's stack) would turn them into join tables.

### One PostgreSQL driver everywhere

Prisma 7 talks to the database through a driver adapter. The app uses `@prisma/adapter-pg`
(node-postgres) both locally and on Neon: Neon accepts standard TCP connections through
its pooler, so there is one code path to test. The Prisma CLI uses Neon's direct
(unpooled) URL for migrations, because PgBouncer does not support the session features they
need.

### Deterministic seed

`prisma/seed.ts` truncates every table and inserts fixed IDs with timestamps derived from
one anchor date, so every run produces identical data (verified by checksumming the tables
across two runs). Re-running the seed is also the "reset the demo" button.

### URL is the filter state

Catalog filters live in the query string (shareable, survive refresh). `searchParams` is
awaited and parsed by a Zod schema that drops invalid values instead of crashing.

### Stack

Next.js 16 (App Router, React Compiler) · TypeScript strict · Tailwind CSS v4 + shadcn/ui ·
Prisma · PostgreSQL on Neon · Zod · bcryptjs · Anthropic SDK (Claude Haiku 4.5) · Vitest ·
Playwright · Vercel.

---

## User flows

_TBD (M9) — the three smoke-tested flows, ideally with a short screen recording._

1. **Buyer:** demo login → catalog sorted by best match → asset → contact seller → message
   appears after refresh.
2. **Seller:** publish an asset → it appears in the catalog → rank buyers → contact a
   buyer.
3. **Manager:** suspend the seller → their assets disappear from the catalog → the buyer's
   thread shows the banner.

---

## AI tools used

_TBD (M9)._ Claude Code, driven by `SPEC.md` milestone by milestone. This section will
record where generated code was rejected or rewritten.

---

## With more time

_TBD (M9)._ Starting list: multi-language (next-intl) · realtime messaging (SSE or
WebSockets) · document data room and NDA flow · email notifications · file and image
uploads · saved searches and alerts · cursor pagination · full-text search (Postgres
`tsvector`) · seller verification / KYC · audit trail for non-moderation edits · MySQL
migration with join tables.
