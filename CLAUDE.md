@AGENTS.md

# N5Deal Marketplace — Claude Code guide

M&A marketplace prototype (Buyer / Seller / Platform Manager). **`SPEC.md` is the source of
truth.** If a decision changes, update `SPEC.md` first, then the code.

## Commands

```bash
npm run dev      # dev server, http://localhost:3000
npm run build    # production build (run before every milestone commit)
npm run lint     # ESLint (flat config, eslint-config-next)
```

Later milestones add: `npx prisma migrate dev`, `npx prisma db seed` (M1), `npm test`
(Vitest), `npx playwright test` (M9).

## Stack

Next.js 16.3 App Router · React 19 + React Compiler · TypeScript strict · Tailwind v4
(CSS-first config in `src/app/globals.css`, no `tailwind.config.*`) · shadcn/ui · Prisma +
PostgreSQL (Neon) · Zod · bcrypt · Anthropic SDK · Vitest · Playwright · Vercel. Package
manager: **npm**.

Next.js 16 differs from older versions: `middleware.ts` is now `proxy.ts`; `params` and
`searchParams` are Promises. Check `node_modules/next/dist/docs/` before using an API you
are unsure of.

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
- [ ] M1 — Tailwind + shadcn, Prisma schema, Neon, seed, Vercel deploy
- [ ] M2 — Sessions, register/login, demo login, guards, `/suspended`
- [ ] M3 — Catalog + detail + URL filters + facet counts
- [ ] M4 — Asset form, my assets, buyer profile
- [ ] M5 — Messaging + contact flows
- [ ] M6 — Buyer directory + match score
- [ ] M7 — Manager + moderation
- [ ] M8 — AI search + fallback
- [ ] M9 — Tests, README final, polish
