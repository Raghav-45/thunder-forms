# AGENTS.md

Instructions for AI agents working in this codebase.

## Required instruction discovery

This file is the entry point and index for repository instructions. If you find
a nested `AGENTS.md` first, return here and complete this workflow before editing.

1. Discover all repository guides from the repository root:
   `rg --files --hidden -g AGENTS.md -g '!node_modules' -g '!.git'`.
   Do not assume your tool automatically loads nested instruction files.
2. Read this file and every discovered `AGENTS.md` in full before the first edit.
   The index below is a navigation aid; discovery also catches newly added guides.
   Guides already read in full during this session need not be reread unless they
   change. If output is truncated, read the remaining content.
3. Apply root rules repository-wide. Apply each nested guide within its directory
   and descendants; reading another area's guide does not extend its scope.
   Within a scope, more specific instructions refine parent instructions.
   Explicit user instructions take precedence over these repository guides.
4. Before editing, briefly identify the guides that apply to the files you will
   change and read any applicable repository skills. Repeat discovery when the
   task expands into another area or instruction files change.
5. Before finishing, check the diff against the applicable guides and report the
   verification actually performed. Do not claim compliance or passing checks
   without checking them.

### Instruction index

- [Root guide](AGENTS.md): repository-wide rules and this discovery workflow.
- [Containers guide](src/containers/AGENTS.md): page and route-family ownership.
- [Templates guide](src/containers/dashboard/templates/AGENTS.md): template
  rendering, configuration, and preview parity; supplements the containers guide.
- [Form Builder guide](src/features/form-builder/AGENTS.md): shared form-building
  feature, field registry, and validation architecture.
- [Field implementation guide](src/features/form-builder/elements/fields/AGENTS.md):
  field renderers, editors, defaults, and validation; supplements Form Builder.

When adding, moving, or removing an `AGENTS.md`, update this index and the affected
parent/child links in the same change. Every nested guide must link back here.

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
