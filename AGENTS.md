# AGENTS.md

## Project structure

- Keep the Next.js route structure in `app/` unchanged.
- Route files in `app/` should be thin entry points that import or directly re-export from `containers/`.
- Put page-level logic and UI in the matching `containers/` folder.
- Keep components that are only used by one feature or route inside that feature's `containers/<feature>/components/` folder, alongside its page-level logic.
- Split larger containers into focused `components/`, `constants/`, `types/`, and `hooks/` files as needed.
- Keep only genuinely reusable, cross-feature components under the root `components/` folder, grouped into focused subfolders where appropriate.
- Remove obsolete duplicate implementations after moving code into `containers/`.
- Keep reusable `lib/` and root `components/` modules independent of `containers/`; shared code must not import a route container.
- Keep route-specific Next.js files such as `layout.tsx`, `loading.tsx`, and `error.tsx` in `app/` when they control framework behavior.
- Keep API handlers in `app/api/` and route-local server actions in `app/` unless their move is explicitly requested.

## Examples

```text
app/(dashboard)/dashboard/page.tsx           -> containers/dashboard/index.tsx
app/(dashboard)/dashboard/forms/page.tsx     -> containers/dashboard/forms/index.tsx
app/(dashboard)/dashboard/templates/page.tsx -> containers/dashboard/templates/index.tsx
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

- Follow KISS: make the smallest change that achieves the requested ownership or behavior goal.
- Do not rename files, exports, or local components solely for aesthetic consistency. Rename only to fix ambiguity, a collision, a real typo, or a concrete ownership problem.
- Do not add folders, wrapper components, barrels, or abstractions unless they reduce real duplication or clarify ownership.
- Preserve URLs, client/server boundaries, public interfaces, failure behavior, ordering, comments, TODOs, and NOTE blocks unless their removal or change is explicitly requested.
- Avoid format-only churn and leave unrelated or explicitly out-of-scope areas untouched.

## Checks

- Verify a structural change with the applicable type check, build, and targeted tests or lint.
