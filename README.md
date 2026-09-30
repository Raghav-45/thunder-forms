# Thunder Forms

AI-native form builder — "the form builder that thinks for you". Build forms with drag-and-drop,
generate them with AI, collect responses, grade quizzes, and sync to Google Sheets.
Ported from Next.js to TanStack Start (Vite + TanStack Router).

## Getting started

```bash
pnpm install
cp .env.sample .env.local   # then fill in real values
pnpm dev                    # http://localhost:3000
```

Required env (see `.env.sample` for the full list): `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`. Optional but feature-gating: `GEMINI_API_KEY` (AI generation),
`RESEND_API_KEY` + `EMAIL_FROM` (quiz grade emails), `ANALYTICS_DATABASE_URL` (dashboard
analytics reads the Umami `website_event` table), Google OAuth keys (Sheets / Forms import /
Drive uploads).

Database:

```bash
pnpm db:push        # push Prisma schema to DATABASE_URL
pnpm db:studio      # browse data
```

## Scripts

```bash
pnpm dev            # dev server (:3000)
pnpm build          # production build
pnpm test           # unit tests (vitest, node project)
pnpm test:watch     # unit tests in watch mode
pnpm test:e2e       # Playwright visual specs (needs dev server; browsers via test:e2e:install)
pnpm generate-routes# regenerate src/routeTree.gen.ts after adding routes
pnpm lint / check   # biome
```

## Structure

```text
src/routes/        # TanStack Router routes (thin wrappers) + src/routes/api/ handlers
src/containers/    # page UI and page-level logic, mirrored by route
src/features/      # shared domain features (form-builder, google-sheets, file-uploads, ...)
src/components/ui/ # shadcn baseline — do not restyle primitives for features
src/lib/           # validators, auth, db, shared utils
```

See `AGENTS.md` for contributor rules and `TODO.md` for the product backlog.

## Routes (high level)

- `/` `/landing-1` — marketing; `/templates` — public gallery; `/auth/*` — login/signup
- `/dashboard` — overview; `/dashboard/forms` — manage; `/dashboard/builder/$slug` — builder
- `/dashboard/forms/$formId/analytics` + `/responses` — per-form insights and grading
- `/forms/$slug` — public fill-and-submit page
- `/api/*` — forms CRUD, submit, uploads, quiz grading, Sheets/Drive/Google-Forms
  integrations, analytics, AI generation
