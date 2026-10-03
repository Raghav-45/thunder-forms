# Form Builder

Instructions for AI agents working in `src/features/form-builder/` and its descendants.

## Instruction navigation

Start with the [root guide and instruction index](../../../AGENTS.md#required-instruction-discovery)
and complete its reading workflow before editing. This guide supplements root rules.

- Parent: [root guide](../../../AGENTS.md).
- Child: [field implementation guide](elements/fields/AGENTS.md), for field-specific rules.
- Required architecture: [Form Structure](FORM_STRUCTURE.md). Read it in full
  before changing form data or its producers and consumers.

## Guiding principle: KISS

Make the smallest change that achieves the requested goal. This feature
already has one field registry, one config-validation dispatcher, and one
data-validation dispatcher — don't add a second of any of them, and don't add
another shared-UI location or barrel file the existing structure doesn't need.

## Field structure

- Every field lives entirely in `elements/fields/<field-name>.tsx`: config
  type, renderer, editor, `defaultConfig`, and `getValidationSchema` all in
  that one file. Keep field-specific validation and defaults there. Shared helpers
  such as
  `elements/choice-options.ts` and `elements/number-constraints.ts` may serve
  multiple fields; do not create another registry or dispatcher.
- Define one local `FIELD_IDENTIFIER` constant in each field file. Use it for
  the config's `uniqueIdentifier` type, the definition's `identifier`, and
  `defaultConfig().uniqueIdentifier`. Do not repeat its raw string literal.
- Register new fields in `elements/index.ts`; an unregistered field is not
  usable anywhere in the builder, renderer, or validation.

## Add a field

1. Create `elements/fields/<field-name>.tsx` following nearby field modules.
   Preserve the existing client/server import boundaries; UI hooks alone are not
   a reason to add a framework directive absent from the current field modules.
2. Define `const FIELD_IDENTIFIER = 'star-rating-input'`, then define
   a config interface extending `BaseFieldConfig` with
   `uniqueIdentifier: typeof FIELD_IDENTIFIER`.
3. Extend `FormFieldDefinition<YourConfig>` and implement `identifier` using
   `FIELD_IDENTIFIER`, plus
   renderer, editor, `defaultConfig`, and `getValidationSchema` in that file.
4. Add one instance to `FIELD_DEFINITIONS` in `elements/index.ts` and its identifier
   to the server-safe allow-list in `form-structure.ts`.
5. Before writing from scratch, skim an existing field close to what you're
   building — `text-input.tsx`, `date-picker.tsx`, `checkbox.tsx`, `switch-field.tsx`.
   Match their structure (proper section comments, `AccordionWithSwitch` usage,
   editor layout) instead of inventing a new shape.

## New field template

Use this as the file outline. Replace the example names and implement the
renderer and editor for the field's actual behavior.

```tsx
import { FormFieldDefinition } from '#/features/form-builder/elements/base'
import type {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '#/features/form-builder/types'
import type React from 'react'
import { z } from 'zod/v3'

const FIELD_IDENTIFIER = 'example-field'

interface ExampleFieldConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  // Add field-specific settings here (follow the guidelines & take inspirations from other fields).
}

const ExampleFieldRenderer: React.FC<FieldProps<ExampleFieldConfig>> = (
  { field, value, onChange, onBlur, error },
) => {
  // Render UI here (follow the guidelines & take inspirations from other fields).
  return null
}

const ExampleFieldEditor: React.FC<
  EditorProps<ExampleFieldConfig> & { isOpen: boolean }
> = ({ field, onUpdate, onClose, isOpen }) => {
  // Render builder settings UI here (follow the guidelines & take inspirations from other fields).
  return null
}

export class ExampleFieldDefinition extends FormFieldDefinition<ExampleFieldConfig> {
  readonly identifier = FIELD_IDENTIFIER
  readonly component = ExampleFieldRenderer
  readonly editor = ExampleFieldEditor

  defaultConfig(): ExampleFieldConfig {
    return {
      id: `example_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Example field',
      required: false,
      disabled: false,
    }
  }

  getValidationSchema(field: ExampleFieldConfig): z.ZodTypeAny {
    const schema = z.string()
    return field.required ? schema.min(1, `${field.label} is required`) : schema.optional()
  }
}
```

Add `new ExampleFieldDefinition()` to `FIELD_DEFINITIONS` in `elements/index.ts`
in the same change. `BaseFieldConfig` gets its allowed identifiers from that
registry. Use a nearby real field as the source for actual UI, settings, and
validation. Keep the `zod/v3` import path every current field uses — the
installed `zod` package is v4 with a v3-compat entry point, so do not
"upgrade" the import to `zod`.

## Validation dispatchers

`utils/` holds two thin dispatchers over `FIELD_REGISTRY`, split by what they
check — don't merge them or add a third:

- `formValidation.ts` validates a *submitted value*, looking up the field in
  `FIELD_REGISTRY` and calling its `getValidationSchema`. Preserve its shared
  required-value handling unless the task changes validation behavior. Both
  public-form validation and `src/routes/api/forms/$id/submit.ts` use this
  dispatcher — this feature intentionally shares `FIELD_REGISTRY` with that
  API route.
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
src/features/form-builder/             # form-building domain feature
├── components/                         # shared settings, respondent rendering, theme scope
├── constants/
│   └── index.ts                        # shared Form Builder constants
├── core/                               # AI generation, import, combined schemas
│   ├── generate-with-ai.tsx
│   ├── generateZodSchema.ts
│   └── import-google-form.tsx
├── elements/                           # field definition system
│   ├── base.ts                         # FormFieldDefinition contract
│   ├── choice-options.ts               # shared choice-option helpers (+ .test.ts)
│   ├── number-constraints.ts           # shared numeric helpers (+ .test.ts)
│   ├── fields/                         # one complete field per file: renderer, editor, defaults, validator
│   │   ├── text-input.tsx
│   │   ├── text-area.tsx
│   │   ├── number-input.tsx
│   │   ├── slider.tsx                  # (+ .test.ts; date-picker and datetime-picker also have tests)
│   │   ├── single-select.tsx
│   │   ├── multi-select.tsx
│   │   ├── radio-group.tsx
│   │   ├── checkbox.tsx
│   │   ├── switch-field.tsx
│   │   ├── date-picker.tsx
│   │   ├── datetime-picker.tsx
│   │   ├── time-picker.tsx
│   │   ├── file-upload.tsx
│   │   └── rating.tsx
│   └── index.ts                        # FIELD_DEFINITIONS and FIELD_REGISTRY
├── form-structure.ts                   # server-safe persisted tree contract (+ .test.ts)
├── theme.ts                            # theme contract and normalization (+ .test.ts)
├── formValidation.test.ts              # answer-validation coverage for all fields
├── server/                             # server-only domain services (quiz-email.ts)
├── store.ts                            # form settings state (+ .test.ts)
├── stories/                            # Storybook field controls, editors, and harness
├── types/
│   └── index.ts                        # shared config and prop types
└── utils/                              # registry dispatch and small helpers
    ├── formValidation.ts               # submitted-value dispatcher
    ├── helperFunctions.ts              # config validation + registry lookups (+ .test.ts)
    └── quiz.ts                         # quiz helpers (+ .test.ts)
```

`components/` contains shared settings, respondent rendering, theme scope,
and other Form Builder UI. Builder-page-only panels belong in its container.
Do not put a new field's UI here instead of co-locating it in
the field's own file, and don't assume every file in this folder is reused by
fields the way `accordion-with-switch.tsx` is.

## Refactoring rules

- Don't rename a field's `uniqueIdentifier` literal (e.g. `'text-input'`) once
  it ships — it's stored as data on forms that already reference it, not just
  a compile-time type. Renaming breaks existing saved forms.
- Rename a file, export, or component only to fix a real ambiguity, collision,
  or typo — never for aesthetic consistency alone.
- No format-only churn. Leave unrelated or out-of-scope files untouched.

## Maintaining this guide

Follow [instruction maintenance](../../../AGENTS.md#maintaining-these-instructions).
When registry integration, shared ownership, or validation dispatch changes,
update the affected sections and the child field guide. Persisted-data changes
also require reviewing [FORM_STRUCTURE.md](FORM_STRUCTURE.md). Keep examples
compatible with `elements/base.ts` and the installed schema import used by fields.

Update triggers in this scope: a new field updates the tree above and the
add-a-field steps; a new shared helper, dispatcher, `core/` consumer, or
`utils/` module updates the field-structure, dispatcher, or tree sections that
name it. Replace obsolete file lists in place rather than appending a second
list, and keep the `zod/v3` example matching what field files import.

## Before finishing

- The new/changed field uses `FIELD_IDENTIFIER` for its config, definition,
  and default config, and is registered in `FIELD_DEFINITIONS`. New identifiers
  also appear in the server-safe structural allow-list.
- Validation logic stays in the field file; no third dispatcher was added.
- Client/server import boundaries are preserved, especially server-safe structural validation.
- Follow the root verification requirements and report actual results.
