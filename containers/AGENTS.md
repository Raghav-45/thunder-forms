# Containers

Instructions for AI agents working in `containers/`. Read root `AGENTS.md`
first — this file only covers container-specific ownership and structure.

## Guiding principle: KISS

Make the smallest change that achieves the requested goal. Keep page and
route-family code near its owner. Don't add folders, wrapper components,
barrels, or abstractions unless they reduce real duplication or clarify
ownership.

## Ownership and dependencies

- A container owns page-level UI, state, components, types, and data for its
  matching route or route family.
- Keep code shared only by sibling routes in its owning container. For example,
  dashboard template data and helpers belong in
  `containers/dashboard/templates/`, even when dashboard builder/testing routes
  consume them.
- Do not promote container-owned code to `features/` merely because sibling
  routes import it. Use `features/` for genuinely cross-area domains, such as
  Form Builder.
- `containers/` may import from `features/`, `lib/`, and root `components/`.
  Never reverse that dependency: `lib/` and root `components/` must not import
  from `containers/`.
- Keep Next.js route and framework files in `app/`; containers must not become
  a second routing layer.

## Directory structure

```text
containers/
├── auth/                              # auth page UI and shared auth components
│   ├── components/
│   ├── login/
│   └── signup/
├── dashboard/                         # dashboard route family
│   ├── builder/[slug]/
│   ├── components/                    # dashboard-wide UI, including sidebar
│   ├── constants/
│   ├── forms/                         # form list, analytics, and responses
│   │   ├── [formId]/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── templates/                     # dashboard template data and UI
│   │   ├── components/
│   │   ├── constants/
│   │   ├── instantiate-template.ts
│   │   └── types/
│   └── dashboard-layout.tsx
├── home/                              # home page UI
├── public/forms/[slug]/               # public form page UI
└── templates/                         # marketing templates page UI
```

Keep a container flat until a `components/`, `constants/`, `hooks/`, or
`types/` split has a real purpose. Each folder must have one clear ownership
boundary; don't create a folder only for consistency with another container.

## Refactoring rules

- Preserve URLs, route behavior, client/server boundaries, public interfaces,
  ordering, comments, TODOs, and NOTE blocks unless the task explicitly asks
  for a change.
- Rename a file, export, or component only to fix a real ambiguity, collision,
  or typo — never for aesthetic consistency alone.
- When moving code into a container, update every consumer and delete the old
  implementation. No duplicate implementations, compatibility copies, or
  re-export shims.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Before finishing

- Matching `app/` routes remain thin and URLs are unchanged.
- Code lives under its narrowest real owner: page, route family, or shared
  feature.
- Client/server boundaries (`"use client"`) are preserved.
- No `lib/` or root `components/` module imports from `containers/`.
- No dead code or duplicate implementations remain.
- The applicable type check, build, and targeted lint/tests all pass.
