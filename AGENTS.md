# AGENTS.md

## Project structure

- Keep the Next.js route structure in `app/` unchanged.
- Route files in `app/` should be thin entry points that import from `containers/`.
- Put page-level logic and UI in the matching `containers/` folder.
- Split larger containers into focused `components/`, `constants/`, `types/` `hooks/ ( if required )`, files.
- Keep global shared components under root level `components/` & focused into their respective `components/` folder.

## Examples

```text
app/(dashboard)/dashboard/page.tsx           -> containers/dashboard/index.tsx
app/(dashboard)/dashboard/forms/page.tsx     -> containers/dashboard/forms/index.tsx
app/(dashboard)/dashboard/templates/page.tsx -> containers/dashboard/templates/index.tsx
```

Keep route-specific Next.js files such as `layout.tsx`, `loading.tsx`, and `error.tsx` in `app/` when they control framework behavior.

## Checks

- Preserve existing URLs and client/server boundaries when moving code.
