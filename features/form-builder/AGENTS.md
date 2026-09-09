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
- Define one local `FIELD_IDENTIFIER` constant in each field file. Use it for
  the config's `uniqueIdentifier` type, the definition's `identifier`, and
  `defaultConfig().uniqueIdentifier`. Do not repeat its raw string literal.
- Register new fields in `elements/index.ts`; an unregistered field is not
  usable anywhere in the builder, renderer, or validation.

## Add a field

1. Create `elements/fields/<field-name>.tsx` with `'use client'` when it
   renders UI or uses client hooks.
2. Define `const FIELD_IDENTIFIER = 'star-rating-input'`, then define
   a config interface extending `BaseFieldConfig` with
   `uniqueIdentifier: typeof FIELD_IDENTIFIER`.
3. Extend `FormFieldDefinition<YourConfig>` and implement `identifier` using
   `FIELD_IDENTIFIER`, plus
   renderer, editor, `defaultConfig`, and `getValidationSchema` in that file.
4. Add one instance to `FIELD_DEFINITIONS` in `elements/index.ts`.
5. Before writing from scratch, skim an existing field close to what you're
   building — `text-input.tsx`, `date-picker.tsx`, `checkbox.tsx`, `switch-field.tsx`.
   Match their structure (proper section comments, `AccordionWithSwitch` usage,
   editor layout) instead of inventing a new shape.

## New field template

Use this as the file outline. Replace the example names and implement the
renderer and editor for the field's actual behavior.

```tsx
'use client'

import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import type {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types/types'
import React from 'react'
import { z } from 'zod'

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
      id: `example_${Date.now()}`,
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
validation.

## Validation dispatchers

`utils/` holds two thin dispatchers over `FIELD_REGISTRY`, split by what they
check — don't merge them or add a third:

- `formValidation.ts` validates a *submitted value*, looking up the field in
  `FIELD_REGISTRY` and calling its `getValidationSchema`. Preserve its shared
  required-value handling unless the task changes validation behavior. Both
  public-form validation and `app/api/forms/[id]/submit/route.ts` use this
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
features/form-builder/                 # form-building domain feature
├── components/                         # Form Builder UI shared by feature flows
├── constants/
│   └── index.ts                        # shared Form Builder constants
├── core/                               # AI generation, import, combined schemas
│   ├── generate-with-ai.tsx
│   ├── generateZodSchema.ts
│   └── import-google-form.tsx
├── elements/                           # field definition system
│   ├── base.ts                         # FormFieldDefinition contract
│   ├── fields/                         # one complete field defined per file, each having its own renderer, editor, defaults, validator
│   │   ├── text-area.tsx
│   │   ├── text-input.tsx
│   │   ├── switch-field.tsx
│   │   ├── date-picker.tsx
│   │   ├── datetime-picker.tsx
│   │   ├── checkbox.tsx
│   │   ├── single-select.tsx
│   │   ├── multi-select.tsx
│   │   ├── number-input.tsx
│   │   ├── radio-group.tsx
│   │   ├── slider.tsx
│   │   └── ...more field types can be added here as needed
│   └── index.ts                        # FIELD_DEFINITIONS and FIELD_REGISTRY
├── store.ts                            # builder state
├── types/
│   └── types.ts                        # shared config and prop types
└── utils/                              # registry dispatch and small helpers
    ├── formValidation.ts
    └── helperFunctions.ts
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

- The new/changed field uses `FIELD_IDENTIFIER` for its config, definition,
  and default config, and is registered in `FIELD_DEFINITIONS`.
- Validation logic stays in the field file; no third dispatcher was added.
- Client/server boundaries (`'use client'`) are preserved.
- The applicable type check, build, and targeted lint/tests all pass.
