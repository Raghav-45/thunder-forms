# AGENTS.md

Instructions for AI agents working in this codebase.

## Guiding principle: KISS

Make the smallest change that achieves the requested goal. Don't add folders, wrapper components, barrels, or abstractions unless they reduce real duplication or clarify ownership. When two approaches both work, pick the boring one over the clever one.

## Project structure

- Page route files in `app/` stay thin — import or re-export from `containers/`, unless framework behavior requires otherwise.
- Page-level logic and UI live in the matching `containers/<route>` folder.
- A component used by only one feature stays in that feature's `containers/<feature>/components/`, next to the logic that uses it — don't promote it to root `components/` just in case.
- Split a container into `components/`, `constants/`, `types/`, `hooks/` only once it's actually grown large enough to need it.
- `lib/` and root `components/` never import from `containers/` — shared code stays independent of any one route.
- Keep `layout.tsx`, `loading.tsx`, `error.tsx` in `app/` — they control framework behavior.
- Keep API handlers in `app/api/` and route-local server actions in `app/` — don't relocate them unless that's explicitly the task.
- When you move code into `containers/`, delete the old implementation. No duplicates left behind.

## Route → container mapping

```text
app/(dashboard)/dashboard/page.tsx           → containers/dashboard/index.tsx
app/(dashboard)/dashboard/forms/page.tsx     → containers/dashboard/forms/index.tsx
app/(dashboard)/dashboard/templates/page.tsx → containers/dashboard/templates/index.tsx
```

## Directory structure

```text
.
├── app/                              # Next.js routes and framework files
│   ├── (app)/                        # home and marketing routes
│   ├── (auth)/auth/                  # auth routes and route-local actions
│   ├── (dashboard)/dashboard/        # dashboard routes and framework layout
│   ├── (public)/forms/[slug]/        # public form route
│   ├── (builder)/dashboard/          # builder and playground routes
│   └── api/                          # API route handlers
├── containers/                       # route/page UI and page-level logic
│   ├── auth/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── forms/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── templates/
│   ├── home/
│   ├── public/forms/[slug]/
│   └── templates/
├── components/                       # genuinely cross-feature UI only
└── lib/                              # reusable utilities and shared domain data
```

## Refactoring rules

- Rename a file, export, or component only to fix a real ambiguity, collision, or typo — never for aesthetic consistency alone.
- Preserve URLs, client/server boundaries, public interfaces, failure behavior, ordering, comments, TODOs, and NOTE blocks unless the task explicitly asks you to change them.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Before finishing

- URLs and routes are unchanged.
- Client/server boundaries (`"use client"`) are preserved.
- No dead code or duplicate implementations introduced by this change remain.
- The applicable type check, build, and targeted lint/tests all pass.
