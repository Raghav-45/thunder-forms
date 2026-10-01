# AGENTS.md

Instructions for AI agents working in this codebase.

## Guiding principle: KISS

Make the smallest change that achieves the requested goal. Don't add folders, wrapper components, barrels, or abstractions unless they reduce real duplication or clarify ownership. When two approaches both work, pick the boring one over the clever one.

## Import conventions

- Use `#/` for every handwritten project-module import, including imports within the same feature or directory. Do not use relative `./` or `../` module imports.
- Use one internal alias only: `#/`. Do not introduce or use `@/` in handwritten code.
- Leave generated files (`src/routeTree.gen.ts` and `src/generated/`) in their generator-prescribed import style.

## Shadcn UI

- Treat `components/ui/` as the original shadcn baseline. Do not change it for feature-specific styling or layout; fix the consuming feature instead. Change a shared primitive only when the task explicitly requires it.

## Skills

- Before starting work, check the repository skills in `.agents/skills/`. When one clearly applies, read and follow its `SKILL.md`.

## Project structure

- Page route files in `src/routes/` stay thin — import or re-export from `containers/`, unless framework behavior requires otherwise.
- Page-level logic and UI live in the matching `containers/<route>` folder.
- A component used by only one feature stays in that feature's `containers/<feature>/components/`, next to the logic that uses it — don't promote it to root `components/` just in case.
- Organize container code by responsibility: use `components/`, `constants/`,
  `types/`, `hooks/`, and `utils/` when code belongs to those roles. Don't keep related
  code flat merely to avoid a folder, and don't create empty or ceremonial
  folders with no clear owner.
- Put a shared domain feature used by multiple routes in `features/<feature>/`; keep its UI, state, types, and utilities together.
- `lib/` and root `components/` never import from `containers/` — shared code stays independent of any one route.
- Keep framework files (`__root.tsx`, route `beforeLoad`, server handlers) in `src/routes/` — they control framework behavior.
- Keep API handlers in `src/routes/api/` — don't relocate them unless that's explicitly the task.
- When you move code into `containers/`, delete the old implementation. No duplicates left behind.

## Route → container mapping

```text
src/routes/dashboard/index.tsx                  → containers/dashboard/index.tsx
src/routes/dashboard/forms/index.tsx            → containers/dashboard/forms/index.tsx
src/routes/dashboard/templates/index.tsx        → containers/dashboard/templates/index.tsx
src/routes/dashboard/builder/$slug/index.tsx    → containers/dashboard/builder/[slug]/index.tsx
src/routes/dashboard/forms/$formId/analytics.tsx → containers/dashboard/forms/[formId]/analytics/index.tsx
src/routes/dashboard/forms/$formId/responses.tsx → containers/dashboard/forms/[formId]/responses/index.tsx
src/routes/forms/$slug/index.tsx                → containers/public/forms/[slug]/index.tsx
src/routes/templates/index.tsx                  → containers/templates/index.tsx
```

## Directory structure

```text
.
├── src/routes/                      # TanStack Router routes and framework files
│   ├── dashboard/                    # dashboard routes and layout (beforeLoad auth guard)
│   │   └── builder/$slug/            # builder route
│   ├── forms/$slug/                  # public form route
│   ├── templates/                    # public templates route
│   ├── auth/                         # auth routes
│   └── api/                          # API route handlers
├── src/containers/                   # route/page UI and page-level logic
│   ├── auth/
│   ├── dashboard/
│   │   ├── builder/[slug]/              # builder page UI (pages/sections/fields + drag-model)
│   │   ├── components/
│   │   ├── forms/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── templates/
│   ├── landing-page/
│   ├── public/forms/[slug]/
│   └── templates/
├── src/features/                     # shared domain features
│   └── form-builder/
├── src/components/                   # genuinely cross-feature UI only
└── src/lib/                          # reusable utilities and shared domain data
```

## Refactoring rules

- Rename a file, export, or component only to fix a real ambiguity, collision, or typo — never for aesthetic consistency alone.
- Preserve URLs, client/server boundaries, public interfaces, failure behavior, ordering, comments, TODOs, and NOTE blocks unless the task explicitly asks you to change them.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Before finishing

- URLs and routes are unchanged.
- No dead code or duplicate implementations introduced by this change remain.
- The applicable type check, build, and targeted lint/tests all pass.
