# Containers

Instructions for AI agents working in `src/containers/` and its descendants.

## Instruction navigation

Start with the [root guide and instruction index](../../AGENTS.md#required-instruction-discovery)
and complete its reading workflow before editing. This guide supplements root rules.

- Parent: [root guide](../../AGENTS.md).
- Child: [templates guide](dashboard/templates/AGENTS.md), for template-specific rules.

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
  `containers/dashboard/templates/`, even when dashboard builder or forms routes
  consume them.
- Do not promote container-owned code to `features/` merely because sibling
  routes import it. Use `features/` for genuinely cross-area domains, such as
  Form Builder.
- `containers/` may import from `features/`, `lib/`, and root `components/`.
  Never reverse that dependency: `lib/` and root `components/` must not import
  from `containers/`.
- Keep TanStack route and framework files in `src/routes/`; containers must not become
  a second routing layer.

## Directory structure

```text
src/containers/
├── auth/                              # auth page UI and shared auth components
│   ├── components/                    # login-form, signup-form, oauth-buttons
│   ├── login/
│   ├── signup/
│   ├── auth-layout.tsx
│   └── index.tsx
├── dashboard/                         # dashboard route family
│   ├── builder/[slug]/                # builder page UI
│   │   ├── components/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── drag-model.ts
│   │   └── index.tsx
│   ├── components/                    # dashboard-wide UI, including sidebar
│   ├── constants/
│   ├── forms/                         # form list, analytics, and responses
│   │   ├── [formId]/
│   │   │   ├── analytics/
│   │   │   └── responses/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── templates/                     # dashboard template data and UI
│   │   ├── components/
│   │   ├── constants/
│   │   ├── instantiate-template.ts
│   │   └── types/
│   └── dashboard-layout.tsx
├── landing-page/                      # marketing landing page UI (+ components/)
├── public/forms/[slug]/               # public form page UI (+ components/)
└── templates/                         # marketing templates page UI (+ components/)
```

Organize code by responsibility from the start: use folders like `components/`,
`constants/`, `types/`, `hooks/`, and `utils/` when code belongs to those roles. One
well-owned file is enough reason for a folder; don't keep code flat merely to
avoid a folder. Each folder must have a clear ownership boundary — don't add
empty or ceremonial folders only for consistency with another container.

## Refactoring rules

- Preserve URLs, route behavior, public interfaces,
  ordering, comments, TODOs, and NOTE blocks unless the task explicitly asks
  for a change.
- Rename a file, export, or component only to fix a real ambiguity, collision,
  or typo — never for aesthetic consistency alone.
- When moving code into a container, update every consumer and delete the old
  implementation. No duplicate implementations, compatibility copies, or
  re-export shims.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Maintaining this guide

Follow [instruction maintenance](../../AGENTS.md#maintaining-these-instructions).
Update ownership and route mappings when an authorized feature moves page logic
or introduces a new route family. Keep route-specific behavior in its owning
guide and update the root index when adding or moving a guide.

Update triggers in this scope: a new route family or moved page UI updates the
tree above; a new template default or preview rule belongs in the child
templates guide, not here. Replace obsolete paths in place, verify every listed
path exists, and keep examples in `#/` import style.

## Before finishing

- Matching `src/routes/` routes remain thin; preserve URLs unless the requested feature changes them.
- Code lives under its narrowest real owner: page, route family, or shared
  feature.
- No `lib/` or root `components/` module imports from `containers/`.
- No dead code or duplicate implementations remain.
- Follow the root verification requirements and report actual results.
