# N5Deal Marketplace Prototype — Spec

Source of truth for the build. Every milestone is implemented from this file; if a decision
changes during the build, this file changes first, then the code.

- **Assignment:** working M&A marketplace prototype with three roles — Buyer, Seller,
  Platform Manager. Hard requirements: Next.js + TypeScript, a working app (not static
  screens), state persists across refresh, enough demo data to evaluate the main flows.
- **Time box:** 24 hours from start to submission (~13 hours of work).
- **Visual reference:** https://n5deal.com/all-listing — match the look, not 1:1.
- **Deliverables:** source code, README (launch steps, key decisions, assumptions, AI tools
  used, what to improve), deployed URL.

---

## 1. Assumptions

1. One account = one role. Buyers and Sellers register themselves; Platform Managers are
   seeded only.
2. The asset catalog is **public** (as on n5deal.com). Contacting a seller requires a Buyer
   account.
3. The buyer directory is **private** — visible to Sellers and Managers only. Buyers'
   acquisition plans are commercially sensitive.
4. Sellers stay **anonymous** on listings ("Verified seller") until a conversation starts.
   n5deal.com shows `Seller: N/A` for the same reason.
5. "Contact" means an in-app conversation tied to one asset, not an email. It keeps
   history, allows moderation, and prevents duplicate threads.
6. All prices are in EUR, stored as whole euros. No currency switcher.
7. Managers moderate accounts and listings; they do not read private conversations in this
   prototype.
8. No payments, documents/NDAs, file uploads, or email notifications.

---

## 2. Roles and permissions

| Capability | Anonymous | Buyer | Seller | Manager |
|---|---|---|---|---|
| Browse / filter / search published assets | ✓ | ✓ | ✓ | ✓ (all statuses) |
| See match score on assets | | ✓ | | |
| Create / edit own buyer profile | | ✓ | | |
| Contact a seller about an asset | | ✓ | | |
| Publish / edit / unpublish own assets | | | ✓ | |
| Browse / filter / search buyers | | | ✓ | ✓ |
| Rank buyers against one of own assets | | | ✓ | |
| Contact a buyer (about one of own assets) | | | ✓ | |
| Messages (own conversations) | | ✓ | ✓ | |
| Suspend / reinstate / remove participants | | | | ✓ |
| Hide / unhide / remove assets | | | | ✓ |
| View moderation log | | | | ✓ |

Every rule in this table is enforced in the **service layer**, never only in the UI or in
`proxy.ts` (see §6).

---

## 3. Data model (Prisma, PostgreSQL)

```prisma
enum Role            { BUYER SELLER MANAGER }
enum UserStatus      { ACTIVE SUSPENDED REMOVED }
enum Category        { BANK FINTECH PAYMENT EMI CRYPTO }          // n5deal.com tabs
enum BusinessStatus  { ACTIVE LICENSE_ONLY }                      // n5deal.com filter
enum AssetStatus     { DRAFT PUBLISHED HIDDEN REMOVED }           // HIDDEN = by manager
enum BuyerType       { PE_FUND STRATEGIC FAMILY_OFFICE FINTECH_OPERATOR INDIVIDUAL }
enum StatusPref      { ANY ACTIVE LICENSE_ONLY }
enum Timeline        { IMMEDIATE WITHIN_3_MONTHS WITHIN_6_MONTHS EXPLORING }
enum ModerationAction {
  SUSPEND_USER REINSTATE_USER REMOVE_USER HIDE_ASSET UNHIDE_ASSET REMOVE_ASSET
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  name          String
  companyName   String?
  role          Role
  status        UserStatus @default(ACTIVE)
  statusReason  String?
  createdAt     DateTime   @default(now())
  buyerProfile  BuyerProfile?
  assets        Asset[]
  sessions      Session[]
}

model Session {
  id         String   @id              // SHA-256 of the cookie token, never the raw token
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  @@index([userId])
}

model BuyerProfile {
  userId        String     @id
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  buyerType     BuyerType
  ticketMinEur  Int?
  ticketMaxEur  Int?
  categories    Category[]
  countries     String[]                // ISO 3166-1 alpha-2; empty = any
  statusPref    StatusPref @default(ANY)
  timeline      Timeline   @default(EXPLORING)
  thesis        String                  // investment / acquisition interests, free text
  isVisible     Boolean    @default(true)
  updatedAt     DateTime   @updatedAt
}

model Asset {
  id              String         @id @default(cuid())
  slug            String         @unique   // e.g. "malta-emi-751"
  sellerId        String
  seller          User           @relation(fields: [sellerId], references: [id])
  title           String
  category        Category
  businessStatus  BusinessStatus
  country         String                   // ISO alpha-2
  regulator       String?                  // e.g. "MFSA"
  licenseType     String                   // e.g. "EMI", "PI", "CASP", "Banking"
  otherLicenses   String[]
  yearOfIssue     Int?
  employees       Int?
  priceEur        Int?                     // whole euros; null = price on request
  benefits        String[]                 // tag chips, e.g. "MiCA registered"
  description     String
  status          AssetStatus    @default(DRAFT)
  statusReason    String?                  // set when a manager hides/removes it
  publishedAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  @@index([status, category])
  @@index([country])
}

model Conversation {
  id              String    @id @default(cuid())
  assetId         String
  asset           Asset     @relation(fields: [assetId], references: [id])
  buyerId         String
  sellerId        String
  initiatedBy     Role                     // BUYER or SELLER
  buyerLastRead   DateTime?
  sellerLastRead  DateTime?
  lastMessageAt   DateTime  @default(now())
  createdAt       DateTime  @default(now())
  messages        Message[]
  @@unique([assetId, buyerId])             // one thread per buyer per asset
  @@index([buyerId, lastMessageAt])
  @@index([sellerId, lastMessageAt])
}

model Message {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId        String
  body            String                   // 1–2000 chars
  createdAt       DateTime     @default(now())
  @@index([conversationId, createdAt])
}

model ModerationLog {
  id             String           @id @default(cuid())
  managerId      String
  action         ModerationAction
  targetUserId   String?
  targetAssetId  String?
  reason         String
  createdAt      DateTime         @default(now())
  @@index([createdAt])
}
```

Model notes:

- `priceEur` is whole euros in an `Int` (max ~€2.1B): no floating-point money, no BigInt
  serialization issues.
- Array columns are PostgreSQL-specific. Moving to MySQL (N5Deal's stack) would turn
  `categories`, `countries`, `otherLicenses`, and `benefits` into join tables — say so in
  the README.
- Suspension does **not** mutate assets. Visibility is derived from the seller's status at
  query time, so reinstating a seller restores everything with no data repair.

---

## 4. Business rules

### 4.1 Visibility

| Query | Rule |
|---|---|
| Public catalog / asset detail | `asset.status = PUBLISHED` **and** `seller.status = ACTIVE` |
| Owner view | Owner sees own assets in any status except `REMOVED`, with `statusReason` |
| Manager view | Everything, including `HIDDEN` and `REMOVED` |
| Buyer directory | Viewer is an active Seller or a Manager; `buyer.status = ACTIVE` and `profile.isVisible` |

These live in one module (`server/policies/`) as pure functions plus matching Prisma
`where` builders, so they can be unit-tested and reused by every query.

### 4.2 Conversations

- Buyer → Seller: started from an asset the buyer can see.
- Seller → Buyer: the seller picks one of their own `PUBLISHED` assets.
- Starting a second conversation for the same buyer + asset opens the existing one.
- Either party not `ACTIVE` → the thread stays readable for the active party, sending is
  disabled, and a banner explains why.
- Removed users appear as "Removed user" in existing threads.

### 4.3 Moderation

| Action | Effect | Reversible |
|---|---|---|
| Suspend user | `status = SUSPENDED`, reason stored, **all sessions deleted** (instant logout), their assets and profile disappear from public queries | Yes — Reinstate |
| Remove user | `status = REMOVED`, sessions deleted, name/email anonymized, their assets → `REMOVED` | No |
| Hide asset | `status = HIDDEN`, reason shown to the owner | Yes — Unhide |
| Remove asset | `status = REMOVED` | No |

- A reason (min 10 chars) is required for every action; every action writes a `ModerationLog` row.
- Managers cannot act on Managers or on themselves.
- A suspended user who logs in lands on `/suspended`, which shows the reason. A removed user
  gets the normal "invalid credentials" error.

### 4.4 Match score (0–100)

One pure function, `matchScore(asset, buyerProfile)`, used both ways: "match %" on asset
cards for buyers, and "rank buyers for my asset" for sellers.

| Signal | Points |
|---|---|
| `asset.category` ∈ `profile.categories` (empty list = any → 20) | 40 |
| `asset.country` ∈ `profile.countries` (empty list = any → 15) | 25 |
| Price inside `[ticketMin, ticketMax]` → 25; within 20% outside → 10; price on request or no ticket set → 12 | 25 |
| `statusPref` is `ANY` or equals `asset.businessStatus` | 10 |

Unit-test the edges: empty lists, missing ticket, price on request, the boundaries of the
20% band.

---

## 5. Screens

Global header by role:

- **Anonymous:** All listings · Log in · *Start now*
- **Buyer:** Assets · Messages (unread count) · My profile
- **Seller:** Buyers · My assets · *+ Publish asset* · Messages (unread count)
- **Manager:** Overview · Participants

### Shared

**S1. Login / Register — `/login`, `/register`**
- Three demo cards at the top: *Enter as Buyer*, *Enter as Seller*, *Enter as Manager*
  (one click, no typing). The demo password is printed under them.
- Email + password form below. Register adds name, company, and a Buyer / Seller choice.
- After register: Buyer → S5 (profile onboarding); Seller → S7 (first asset).

**S2. Messages — `/messages`, `/messages/[id]`**
- Desktop: two panes. Left: conversations (counterpart, asset title, last message
  preview, time, unread dot). Right: thread with an asset card on top, messages, and a
  composer.
- Mobile: list → thread.
- Banner + disabled composer when the counterpart is suspended or removed.
- Empty state: Buyer → "Browse assets"; Seller → "Find buyers".

### Buyer

**S3. Asset catalog — `/assets` (public)**
- Category pill tabs with counts: All · Bank · Fintech · Payment · EMI · Crypto. Counts
  respect every active filter except category (facet counts).
- Search box with an **AI search** toggle (§7). When AI search is used, show the
  interpreted filters as removable chips: "EMI · Malta, Lithuania · ≤ €500k".
- Filter panel (side panel on desktop, drawer on mobile): country (multi-select with
  search), price min/max, business status (Active / License only), license type,
  regulator. *Reset all filters*.
- Sort: Newest (default) · Price ↑ · Price ↓ · Best match (Buyers only).
- Result count, 12 cards per page, pagination.
- Card: flag + country, category badge, "Type of Asset: Active Business (Licensed)" /
  "License only", label/value rows (Price, Country, Type of business, Business status,
  License, Regulator), up to 3 benefit chips, 2-line description, *View asset*. A logged-in
  Buyer also sees a **match badge** ("92% match").
- All filter state lives in the URL query string (shareable, survives refresh). Invalid
  params are ignored, never a crash.
- Empty state: "No assets match these filters" + *Reset filters*.

**S4. Asset detail — `/assets/[slug]`**
- Header: flag, title, category, business status badge, price (or "Price on request").
- Key-facts grid: country, regulator, license type, other licenses, year of issue,
  employees.
- Benefit chips, full description.
- Seller block: "Verified seller" until the viewer has a conversation about this asset,
  then the seller's company name.
- Primary action by viewer:
  - Anonymous → *Log in as a buyer to contact*
  - Buyer → *Contact seller* (opens S2 with the first message prefilled), or *Open
    conversation* if one exists
  - Owner → *Edit* · *Unpublish*, plus a status banner if hidden by a manager
  - Manager → *Hide* / *Remove* (reason modal)
- Not visible to this viewer → 404.

**S5. My profile — `/profile`**
- Fields: buyer type, company, ticket min–max (€), target categories (multi), target
  countries (multi, empty = any), business status preference, timeline, investment thesis
  (textarea, 50–2000 chars), "Visible to sellers" toggle.
- Profile completeness meter (share of filled fields).
- On first login this is the onboarding step; after saving → S3 sorted by *Best match*.

### Seller

**S6. My assets — `/seller/assets`**
- List of own assets: title, category, price, status badge (Draft / Published / Hidden by
  manager + reason), conversation count, updated date.
- Actions: Edit, Publish / Unpublish.
- Empty state: "Publish your first asset" → S7.

**S7. Asset form — `/seller/assets/new`, `/seller/assets/[id]/edit`**
- Sections: **Basics** (title, category, business status, country, regulator, license
  type, other licenses) · **Price** (amount in € or "Price on request") · **Details**
  (benefits as chips, description 100–5000 chars, year of issue, employees).
- **Live card preview** beside the form, using the same component as S3.
- *Save draft* / *Publish*. Zod errors next to each field, preserved input on error.

**S8. Buyer directory — `/buyers`**
- Search (name, company, thesis) + filters: category interest, country, ticket range
  overlap, buyer type.
- **"Rank for: [one of my assets ▾]"** — sorts by `matchScore` and shows the % on each card.
- Card: company / name, buyer type, ticket range, category chips, countries, thesis
  excerpt, timeline, *View* / *Contact*.
- Empty state + reset.

**S9. Buyer detail — `/buyers/[id]`**
- Full profile + *Contact buyer*: pick one of your published assets, write the first
  message. If a conversation already exists for that asset → open it.

### Platform Manager

**S10. Overview — `/manager`**
- Stat cards: buyers, sellers, published assets, hidden assets, suspended users.
- Assets table: search (title), filters (category, country, status, seller), columns
  (title, seller, category, price, status, published date), row actions: view, hide /
  unhide, remove.
- Recent moderation log (last 20: when, manager, action, target, reason).

**S11. Participants — `/manager/users`**
- Tabs: Buyers / Sellers. Search (name, email, company), status filter (active /
  suspended / removed).
- Columns: name, company, email, status (+ reason), joined, assets or profile summary,
  conversation count.
- Actions: *Suspend* (reason modal), *Reinstate*, *Remove* (confirm dialog with the typed
  company name, reason modal).

### States (not separate screens)

`/suspended` (shows the reason) · 404 page · empty states on every list · loading
skeletons on S3, S8, and S2 · error boundary per route group.

---

## 6. Architecture

```
src/
  app/                          routes only: pages, layouts, loading/error files
    (public)/assets/            S3, S4
    (auth)/login, register/     S1
    (app)/messages/             S2
    (app)/profile/              S5
    (app)/seller/assets/        S6, S7
    (app)/buyers/               S8, S9
    (app)/manager/              S10, S11
    api/ai-search/route.ts      the only route handler
  server/                       every file starts with: import 'server-only'
    db.ts                       Prisma client singleton
    auth/                       session.ts (create/verify/destroy), guards.ts (requireUser, requireRole)
    policies/                   visibility + permission rules, pure (§4.1)
    assets/                     asset.schema.ts · asset.repo.ts · asset.service.ts · asset.actions.ts
    buyers/                     same four-file shape
    messaging/                  same
    moderation/                 same
    matching/                   matchScore (§4.4), pure
    ai-search/                  prompt, Claude call, output schema, fallback
  components/                   UI; AssetCard is shared by S3, S4, S7
  lib/                          formatters (price, country flag), URL ⇄ filter parsing
prisma/
  schema.prisma
  seed.ts
```

The `server/` folder mirrors NestJS layering without the framework:

| Layer | File | NestJS equivalent |
|---|---|---|
| Input validation | `*.schema.ts` (Zod) | DTO + class-validator |
| Data access | `*.repo.ts` (Prisma only) | Repository |
| Business rules + authorization | `*.service.ts` | Provider |
| Entry point from forms | `*.actions.ts` (server actions) | Controller |
| Auth checks | `auth/guards.ts` | Guards |

Rules:

1. **Reads:** Server Components call services directly — no internal HTTP.
2. **Writes:** server actions → Zod parse → service (authorization + rules) → repo →
   `revalidatePath`.
3. **Authorization happens in services.** `proxy.ts` (named `middleware.ts` before
   Next.js 16) only redirects for UX. Reason: CVE-2025-29927 showed that checks living only
   in Next.js middleware can be bypassed.
4. **Sessions:** a random 32-byte token in an `httpOnly`, `Secure`, `SameSite=Lax`
   cookie; the database stores only its SHA-256 hash. `getCurrentUser()` is wrapped in
   React `cache()` so it runs once per request, and it rejects any user who is not `ACTIVE`.
   Suspending a user deletes their sessions, so the effect is immediate — unlike a JWT,
   which stays valid until it expires.
5. Passwords: bcrypt (cost 10).
6. `searchParams` is a Promise in current Next.js: await it, then parse with a Zod schema
   in `lib/` that drops invalid values.

**Stack:** Next.js (App Router) · TypeScript strict · Tailwind CSS + shadcn/ui · Prisma ·
PostgreSQL on Neon · Zod · bcrypt · Anthropic SDK · Vitest · Playwright · Vercel.

Why one Next.js app instead of a separate NestJS backend: one deploy, types shared end to
end, no CORS or cross-domain cookies, and it matches N5Deal's move to Next.js/TypeScript.
If a mobile client, background workers, or a separate backend team appear, the services in
`server/` move into a standalone service without a rewrite.

---

## 7. AI search (smart filtering)

- **Input:** free text on S3, e.g. "EMI license in the EU under 500k, active business".
- **Flow:** `POST /api/ai-search` → Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) with a
  single forced tool whose input schema is the filter object below → Zod parse → the client
  navigates to `/assets?<params>` → chips show the interpretation; each chip can be removed.
- **Output schema:**
  ```ts
  {
    categories?: Category[];
    countries?: string[];          // ISO alpha-2, expanded from "EU", "Baltics", etc.
    priceMinEur?: number;
    priceMaxEur?: number;
    businessStatus?: BusinessStatus[];
    licenseTypes?: string[];
    keywords?: string;             // whatever doesn't map to a structured filter
  }
  ```
- **Safety:** the model only produces filter values. Zod enums and ranges validate them,
  so a prompt injection can at worst produce a wrong filter, never a query or an action.
- **Fallback:** no `ANTHROPIC_API_KEY`, a 5-second timeout, or invalid output → use the
  text as a plain keyword search and show "AI search unavailable — showing keyword results".
- **Limit:** 20 AI searches per hour per session or IP (counter table or in-memory per
  instance — note the trade-off in the README).

---

## 8. Seed data (`prisma/seed.ts`)

Deterministic: same data on every run, idempotent.

- **Demo accounts** (password printed on S1):
  - `buyer@demo.n5deal` — PE fund, complete profile, 2 conversations
  - `seller@demo.n5deal` — 4 assets: 3 published, 1 draft; 1 conversation
  - `manager@demo.n5deal`
- **~30 assets** across all five categories and ~12 countries, with real regulators —
  e.g. MT/MFSA, LT/Bank of Lithuania, CY/CySEC, GB/FCA, DE/BaFin, NL/DNB, IE/CBI, EE/FIU,
  CZ/CNB, PL/KNF, CA/FINTRAC. Prices from €50k to €25M, some "on request"; a mix of Active
  and License only.
- **~15 buyers** with varied types, tickets, and countries, so match scores spread out.
- **~6 sellers** — one **suspended** (with a reason) to demonstrate the hiding rule.
- One asset **hidden** by a manager, a handful of conversations, and a few moderation-log
  rows.

---

## 9. Edge cases to handle

- Contacting the same buyer about the same asset twice → opens the existing thread.
- A Seller tries to contact a Buyer with no published assets → explained, with a link to
  S7.
- An asset unpublished or hidden while a buyer is viewing it → the next action returns a
  clear error, not a crash.
- The counterpart is suspended mid-conversation → banner, composer disabled.
- `priceMin > priceMax` in the URL → the two values are swapped.
- Unknown `category` / `country` in the URL → ignored.
- Double-submitting a form → button disabled while pending; conversation creation is
  idempotent through the unique constraint.
- A Manager tries to suspend a Manager or themselves → refused in the service.
- Very long text → length limits in Zod and line clamping in the UI.

---

## 10. Testing

- **Vitest (unit):** `matchScore`, visibility policies, URL ⇄ filter parsing, the AI-output
  schema and fallback, the moderation rules (who can act on whom).
- **Playwright (smoke, against a seeded DB):**
  1. Buyer: demo login → catalog sorted by best match → asset → contact seller → message
     appears after refresh.
  2. Seller: publish an asset → it appears in the catalog → rank buyers → contact a buyer.
  3. Manager: suspend the seller → their assets disappear from the catalog → the buyer's
     thread shows the banner.

---

## 11. Visual direction (from n5deal.com/all-listing)

- Light background; white cards with a thin light border and large rounded corners.
- Category tabs: pills, the active one solid black with white text, counts in brackets.
- Listing cards: label on the left, value on the right, one row per field; price in the
  indigo/blue accent; "Active" in green.
- Country flag at the top of every card.
- Primary buttons: solid accent color, rounded.
- Sample the exact colors and font with devtools; define them as Tailwind theme tokens
  before building components.
- Mobile-first: filters become a drawer, messages become list → thread.

---

## 12. Milestones

Each milestone ends with a commit and a working deploy.

| # | Scope | Done when | Est. |
|---|---|---|---|
| M0 | README skeleton (assumptions, decisions) from this spec | README has §1, §6 content | 0.5h |
| M1 | Next.js + Tailwind + shadcn, Prisma schema, Neon, seed, Vercel deploy | Deployed URL shows seeded assets | 2h |
| M2 | Sessions, register/login, demo login, guards, `/suspended` | All three demo logins work on prod | 1.5h |
| M3 | S3 catalog + S4 detail + filters in the URL + facet counts | Filter → refresh → same results | 2.5h |
| M4 | S7 form + S6 my assets + S5 buyer profile | Seller publishes an asset; it appears in S3 | 2h |
| M5 | S2 messaging + contact flows from S4 and S9 | Buyer ↔ seller thread survives refresh | 1.5h |
| M6 | S8/S9 buyer directory + match score both ways | Seller ranks buyers for an asset | 1h |
| M7 | S10/S11 manager + moderation rules + log | Suspend → content hidden, sessions gone | 1h |
| M8 | AI search + fallback | Natural-language query → correct chips | 1h |
| M9 | Vitest + Playwright, README final, polish | Tests green, README complete | 1h |

**Cut order if behind:** S9 becomes a drawer inside S8 → AI search rate limit becomes
in-memory only → Playwright drops to flow 1 → S6 merges into S7 as a tab.

---

## 13. Out of scope (README → "With more time")

Multi-language (next-intl) · realtime messaging (SSE or WebSockets) · document data room
and NDA flow · email notifications · file and image uploads · saved searches and alerts ·
cursor pagination · full-text search (Postgres `tsvector`) · seller verification / KYC ·
audit trail for non-moderation edits · MySQL migration with join tables.

---

## 14. README checklist

- Launch steps: `.env` (`DATABASE_URL`, optional `ANTHROPIC_API_KEY`), install, migrate,
  seed, dev.
- Deployed URL + the three demo accounts.
- Key technical decisions (§6, sessions vs JWT, authorization in services, derived
  visibility, whole-euro prices).
- Assumptions (§1).
- AI tools used: Claude Code with this spec, milestone by milestone, and where generated
  code was rejected or rewritten.
- What I would improve with more time (§13).
- The three user flows (§10), ideally with a short screen recording.
