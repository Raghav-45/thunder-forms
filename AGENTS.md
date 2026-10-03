# AGENTS.md

Instructions for AI agents working in this codebase.

## Required instruction discovery

This file is the entry point and index for repository instructions. If you find
a nested `AGENTS.md` first, return here and complete this workflow before editing.

1. Discover all repository guides from the repository root:
   `rg --files --hidden -g AGENTS.md -g '!node_modules' -g '!.git'`.
   Do not assume your tool automatically loads nested instruction files.
2. Read this file and every discovered `AGENTS.md` in full before the first edit.
   Also read the required architecture document listed below in full.
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

### Required architecture document

Read [Form Structure](src/features/form-builder/FORM_STRUCTURE.md) alongside
these guides. It defines the shared page/section/field contract, ownership,
validation, ordering, and verification requirements for builders, templates,
imports, APIs, and public forms. Follow it when changing any producer or consumer
of form data. Keep the contract in that document rather than duplicating it here.

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
- Put genuinely cross-area domain features in `features/<feature>/`; keep their UI, state, types, and utilities together. Code shared only by sibling routes stays in its owning container.
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

## Maintaining these instructions

Instruction maintenance is part of feature work, not a separate cleanup project.
After a feature, fix, or refactor, check whether its changes make any applicable
instruction or architecture document inaccurate. Update affected guidance in the
same working change; leave accurate guidance untouched. This does not authorize
committing, pushing, or changing unrelated product behavior.

1. Verify the changed behavior in its implementation, callers, and relevant tests.
   Check paths, exports, scripts, and configuration directly. Do not document a
   plan, an assumption, or a passing check that was not actually run as fact.
2. Distinguish a current-code description from a project rule. A code mismatch
   does not authorize weakening a rule to fit a bug. Preserve user constraints;
   change policy only when the user's requested work authorizes that change.
   Report unresolved conflicts instead of silently choosing a new policy.
3. Update the narrowest owning guide: repository conventions here, container
   ownership in the containers guide, and domain rules in the relevant nested
   guide. Update `FORM_STRUCTURE.md` when persisted shape, validation, ordering,
   or producer/consumer behavior changes. Link to that contract rather than
   copying it into another guide.
4. Replace obsolete statements in place. Update affected examples, navigation
   links, and verification commands together. Do not append a contradictory
   correction, duplicate parent rules, or add a new guide for every feature.
5. Match the existing documentation style: clear English, descriptive Markdown
   headings, short paragraphs, and direct, actionable bullets. State scope and
   necessary exceptions explicitly. Use exact project names and source links.
   Keep code examples consistent with current types, imports, and formatting.
   Do not copy terse chat style, session history, temporary findings, or speculative
   future architecture into permanent instructions.
6. Verify relative links and heading anchors, confirm the root index covers all
   guides, and run `git diff --check`. Re-read changed guidance alongside its
   parent and child guides for contradictions. Report which guides changed and
   what was verified; if no update is needed, say so briefly.

## Verification commands

Use the repository's current scripts and configuration as the source of truth:
[package.json](package.json), [vite.config.ts](vite.config.ts), and
[biome.json](biome.json).

- Unit tests live beside source files as `src/**/*.test.ts`.
  Run `pnpm exec vitest run --project unit <test-paths>` for targeted tests;
  `pnpm test` runs the full unit suite.
- Browser tests live in `tests/visual/`; run
  `pnpm exec playwright test <test-paths>` for affected interactions.
- Type check: `pnpm exec tsc --noEmit`. Production build: `pnpm build`.
- Targeted source check: `pnpm exec biome check <changed-source-paths>`.
  Biome's configured scope excludes some files, including `tests/visual/`;
  an ignored file is not a successful lint check.
- For documentation-only edits, verify referenced facts, links, and
  `git diff --check`; application builds and browser runs are not required unless
  code or executable configuration also changes. Never report skipped checks as passed.

## Before finishing

- URLs, routes, and behavior are preserved unless the requested feature explicitly changes them.
- No dead code or duplicate implementations introduced by this change remain.
- Run the applicable checks above and report any failures or checks that could not run.
- Complete the instruction-maintenance check above; keep affected guides current.
