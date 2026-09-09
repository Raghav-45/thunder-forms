# Containers

Instructions for agents working inside `containers/`.

## Ownership

- A container owns the page-level UI, state, components, types, and data for
  its matching route or route family.
- Keep code shared only by sibling routes in its owning container. For example,
  dashboard template data and helpers belong in `containers/dashboard/templates/`,
  even when dashboard builder/testing routes consume them.
- Do not promote container-owned code to `features/` merely because more than
  one sibling route imports it. Use `features/` only for a genuinely
  cross-area domain, such as Form Builder.
- `containers/` may import from `features/`, `lib/`, and root `components/`.
  Never reverse that dependency: `lib/` and root `components/` must not import
  from `containers/`.

## Keep it simple

- Keep a container flat until it needs a `components/`, `constants/`, `hooks/`,
  or `types/` folder.
- When moving code into a container, update every consumer and delete the old
  implementation. Do not leave compatibility copies or re-export shims.
- Preserve routes, URLs, client/server boundaries, behavior, and existing
  comments unless the task explicitly changes them.
