# N5Deal Marketplace Prototype

A working M&A marketplace prototype for licensed financial businesses (banks, fintechs,
payment institutions, EMIs, crypto/CASP). Three roles — **Buyer**, **Seller**, and
**Platform Manager** — share one Next.js app with persistent state and seeded demo data.

Visual reference: [n5deal.com/all-listing](https://n5deal.com/all-listing). The full build
spec lives in [`SPEC.md`](./SPEC.md); it is the source of truth and changes before the code
does.

> **Status:** M2 — authentication (sessions, register/login, one-click demo login, role
> guards, `/suspended`). Sections marked _TBD_ are filled in by later milestones.

---

## Live demo

- **Deployed URL:** https://n5deal-marketplace-mock.vercel.app
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

AI search is optional: put a Gemini key (free at https://aistudio.google.com/apikey) in
`GEMINI_API_KEY`. Without one, the AI search switch falls back to keyword search with a notice.

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

Details worth knowing:

- Sessions last 7 days. In production the cookie is `__Host-n5deal_session`: the prefix
  makes the browser reject it unless it is `Secure`, `Path=/`, and has no `Domain`.
- Logging in always issues a new token and deletes the previous one (no session fixation).
- Unknown emails are still checked against a dummy bcrypt hash, so response time does not
  reveal which emails have accounts. Removed users get the same "invalid credentials".
- **A suspended user never gets a session.** A correct password sets a 5-minute cookie,
  scoped to `/suspended`, that carries the reason; the page shows it.
- `?next=` after login accepts same-origin paths only. The *normalized* path is checked, so
  `//evil.com`, `/\evil.com`, `/.//evil.com`, and absolute URLs are all dropped.
- At most 50 live sessions per user (oldest pruned at login), so scripted logins cannot
  grow the table without bound; the demo accounts are shared, hence the generous limit.
- Every response sends `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin` (`next.config.ts`).
- Guards (`requireUser`, `requireRole`) run in every private page; wrong-role users are
  sent to their own home. `proxy.ts` only redirects visitors with no cookie at all.

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
awaited and parsed by a Zod schema that drops invalid values instead of crashing. Client
controls never hold their own copy of the filters: they compute the next URL and navigate
inside a React transition (`useOptimistic` makes the click show at once, the results dim
until the server answers). Category tab counts are facet counts — every filter except the
category — and the same `GROUP BY` also yields the result total, so no separate `COUNT(*)`
is needed; it runs in parallel with the page query.

### Messaging: one thread per buyer per asset, no realtime

A conversation is tied to one asset, and `@@unique([assetId, buyerId])` makes "contact" idempotent:
a second first message (double click, two tabs, buyer and seller at once) lands in the
existing thread. The write is an upsert plus the message in one transaction, retried once on
a unique violation. Unread state is two timestamps per thread (`buyerLastRead`,
`sellerLastRead`) compared with `lastMessageAt` — the header count is one `COUNT` using Prisma
field references, with no per-message read rows. The thread is marked read by a server action
fired after it renders, so a page render (or a link prefetch) never writes. Sent messages show
at once via `useOptimistic`; new messages from the other side appear on the next navigation or
refresh (realtime is out of scope). Sending is refused in the service when the counterpart is
suspended or removed; the thread stays readable with a banner.

### Match score: one pure function, ranked in the service

`matchScore(asset, buyerProfile)` (SPEC §4.4: category 40, country 25, price vs ticket 25,
business status 10) is the only definition of "fit". Buyers see it as a badge on every asset
card and as the *Best match* sort; sellers use it to rank the buyer directory for one of their
published assets ("Rank for") and see it per asset, split into its signals, on a buyer's page.
Postgres cannot sort by a TypeScript function, so ranking is three steps: fetch the scoring
columns of every match (capped at 1000, newest first), score and sort in memory (score, then
recency, then id, so pagination is stable), then load only the visible page by id — still
through the visibility `where` builders. A SQL copy of the formula was rejected: two sources of
truth that drift, and raw SQL would bypass the policy builders. At real scale the next step is
precomputed scores. The 20% price band is checked in integer arithmetic, not with ×0.8 / ×1.2.
`?rank=` is never looked up directly: it must be one of the viewer's own published assets,
which the service has already loaded for the dropdown, so another seller's asset ids cannot be
probed.

### Moderation: conditional writes, logged in the same transaction

Managers suspend, reinstate, and remove buyers and sellers (S11) and hide, unhide, and remove
assets (S10, or from the asset page). Each action needs a reason and writes a `ModerationLog`
row in the **same transaction** as the change, so the log can never disagree with the data.
The allowed transitions (suspend only `ACTIVE`, unhide only `HIDDEN`, …) and "managers cannot
act on managers or themselves" are pure functions in `server/policies/moderation-rules.ts`;
the screens use them to choose which buttons to show, the service to refuse everything else.
Every update is conditional on the status the service just read (`updateMany … where status =
<seen>`), so two managers clicking at once — or a seller unpublishing while a manager hides —
cannot overwrite each other; the loser gets "changed in the meantime". Suspension deletes the
user's sessions in that transaction, which is the instant logout a JWT could not give; their
listings vanish because visibility is derived at query time, and reinstating restores
everything with no repair. Removal is permanent: name, email, and company are overwritten,
the buyer profile is deleted, and every asset becomes `REMOVED` — but the row stays, so
conversations and the log keep their foreign keys and show "Removed user". Removing an
account asks for its company name to be typed, checked again in the service.

### AI search: the model only fills in filters

With the switch on, the catalog search sends the sentence to `POST /api/ai-search` (the app's
only route handler). Gemini 3.5 Flash-Lite answers with structured output: JSON constrained
by a schema of the catalog's filters (categories, regions, countries, price range, business
status, license types, a few leftover keywords). Zod checks the reply, and then it goes
through the **same parser as the URL**, so a model answer is held to exactly the rules of a
hand-edited link. The client puts the result in the URL; the chips are the interpretation,
and each can be removed. Because the model can only produce filter values, a prompt
injection can at worst produce a wrong filter, never a query or an action.

- **Why Gemini, not Claude Haiku:** the Gemini API has a free tier, and mapping one sentence
  to a small filter object needs nothing bigger than a Flash-Lite model (~1 s per call). One
  function (`interpretQuery` in `server/ai-search/ai-search.model.ts`) talks to the model,
  so changing provider touches one file. The model name is pinned, not `-latest`.
- **Regions are expanded in code.** The model answers "EU" or "BALTICS"; `lib/regions.ts`
  turns that into ISO codes, because a model listing the 27 EU members from memory can drop
  one. The chips show a whole region as one "EU" chip rather than 27.
- **License types are an enum of what is in the catalog**, so the model cannot invent one
  that matches nothing; the prompt keeps it from repeating the category ("EMI license" is
  the EMI category, not the license type that would hide "Small EMI" listings).
- **Fallback, never an error:** no key, an API error (the free quota running out included),
  a 5-second timeout, or an invalid reply → the text runs as a keyword search with a notice.
- **Rate limit:** 20 searches per hour per account, or per hashed IP for visitors, counted
  in an `AiSearchUsage` table with one atomic `INSERT … ON CONFLICT` per search. A table
  rather than memory because serverless instances do not share memory, so an in-memory
  counter would reset at random. The cost is one extra write per search; fixed one-hour
  windows also allow a burst of up to 2× the limit across a window boundary, which is
  acceptable here. The endpoint only accepts JSON, so other sites cannot spend the quota
  through visitors' browsers without a CORS preflight, which fails.

### Stack

Next.js 16 (App Router, React Compiler) · TypeScript strict · Tailwind CSS v4 + shadcn/ui ·
Prisma · PostgreSQL on Neon · Zod · bcryptjs · Google Gen AI SDK (Gemini 3.5 Flash-Lite) ·
Vitest · Playwright · Vercel.

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
migration with join tables · login rate limiting and lockout (shared store such as
Redis, since serverless instances do not share memory).
