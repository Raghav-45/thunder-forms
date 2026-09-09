# Form Builder

Instructions for AI agents working in `features/form-builder/`. Read root
`AGENTS.md` first — this file only covers what's specific to this feature.

## Guiding principle: KISS

Make the smallest change that achieves the requested goal. This feature
already has one field registry, one config-validation dispatcher, and one
data-validation dispatcher — don't add a second of any of them, and don't add
a components subfolder or barrel file the existing structure doesn't need.

## Field structure

- Every field lives entirely in `elements/fields/<field-name>.tsx`: config
  type, renderer, editor, `defaultConfig`, and `getValidationSchema` all in
  that one file. Don't split a field's validation or defaults into another
  registry, utility, or folder.
- `identifier` and `config.uniqueIdentifier` must use the same literal value —
  the base class enforces this at type-check time.
- Register new fields in `elements/index.ts`; an unregistered field is not
  usable anywhere in the builder, renderer, or validation.

## Add a field

1. Create `elements/fields/<field-name>.tsx` with `'use client'` when it
   renders UI or uses client hooks.
2. Define a config interface extending `BaseFieldConfig`, with a literal
   `uniqueIdentifier` such as `'star-rating-input'`.
3. Extend `FormFieldDefinition<YourConfig>` and implement `identifier`,
   renderer, editor, `defaultConfig`, and `getValidationSchema` in that file.
4. Add one instance to `FIELD_DEFINITIONS` in `elements/index.ts`.
5. Before writing from scratch, skim an existing field close to what you're
   building — `text-input.tsx`, `date-picker.tsx`, `checkbox.tsx`, `switch-field.tsx`.
   Match their structure (proper section comments, `AccordionWithSwitch` usage,
   editor layout) instead of inventing a new shape.

## Validation dispatchers

`utils/` holds two thin dispatchers over `FIELD_REGISTRY`, split by what they
check — don't merge them or add a third:

- `formValidation.ts` validates a *submitted value*, looking up the field in
  `FIELD_REGISTRY` and calling its `getValidationSchema`. Preserve its shared
  required-value handling and its display-only section-header skip unless the
  task changes validation behavior. Both public-form validation and
  `app/api/forms/[id]/submit/route.ts` use this dispatcher — this feature
  intentionally shares `FIELD_REGISTRY` with that API route.
- `helperFunctions.ts` validates a *field's own config*
  (`validateFieldConfig`: is the id/label present and well-formed), plus small
  registry lookups (`getFieldComponent`, `getFieldEditor`,
  `createDefaultFieldConfig`). This is a different concern from submitted-value
  validation above — keep it there.

`FIELD_REGISTRY` has other consumers too — `core/generateZodSchema.ts` builds
one combined Zod schema across all fields for the AI-generation path. Don't
assume there are only two call sites when changing the registry's shape, and
don't extract a second validator registry unless the task explicitly changes
this architecture.

## Directory structure

```text
elements/
├── base.ts         # FormFieldDefinition contract — shared by every field
├── index.ts         # FIELD_DEFINITIONS list + FIELD_REGISTRY built from it
└── fields/           # one complete field per file (see Field structure)
components/
├── accordion-with-switch.tsx     # the one component shared across field editors
├── settings-dialog.tsx           # form-level settings (title, expiry, redirect) — not field UI
├── date-picker-with-presets.tsx  # used only by settings-dialog
└── copy-button.tsx
core/                 # builder composition: AI generation, Google Forms import,
│                      # generateZodSchema.ts (combined schema for the AI path)
types/types.ts         # shared config/prop types; available field types derive from FIELD_REGISTRY
utils/                 # formValidation.ts + helperFunctions.ts (see above)
store.ts               # builder state only
constants/              # shared Form Builder constants
```

`components/` is not exclusively field UI — most of it belongs to the
settings dialog. Don't put a new field's UI here instead of co-locating it in
the field's own file, and don't assume every file in this folder is reused by
fields the way `accordion-with-switch.tsx` is.

## Refactoring rules

- Don't rename a field's `uniqueIdentifier` literal (e.g. `'text-input'`) once
  it ships — it's stored as data on forms that already reference it, not just
  a compile-time type. Renaming breaks existing saved forms.
- Rename a file, export, or component only to fix a real ambiguity, collision,
  or typo — never for aesthetic consistency alone.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Before finishing

- The new/changed field is registered in `FIELD_DEFINITIONS` and its
  `identifier` matches `config.uniqueIdentifier`.
- Validation logic stays in the field file; no third dispatcher was added.
- Client/server boundaries (`'use client'`) are preserved.
- The applicable type check, build, and targeted lint/tests all pass.