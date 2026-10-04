# Form Structure

This document describes the current persisted form contract. Read it with the
[root instruction index](../../../AGENTS.md#required-instruction-discovery) and
[Form Builder guide](AGENTS.md). Update it when the contract or its consumers change.

## Contract and storage

ThunderForms stores the form tree in `forms.fields`, a JSON column in the
[Prisma schema](../../../prisma/schema.prisma). The shared TypeScript contract is
owned by [form-structure.ts](form-structure.ts):

```ts
interface FormStructure {
  pages: FormPage[];
  layout?: FormLayout;
  quiz?: QuizSettings;
  theme?: StoredFormTheme;
}

interface FormPage {
  id: string;
  title?: string;
  description?: string;
  sections: FormSection[];
}

interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig[];
}
```

`FieldConfig` is the registry's union of field configurations. Each field keeps
its persisted `id` and `uniqueIdentifier`; do not rename identifiers or regenerate
IDs during ordinary edits. Submitted answers are keyed by field ID.

Form-level title, description, expiry, submission limit, redirect URL, and
`submitButtonText` are separate form properties, not members of this tree. See
[FormValidator](../../lib/validators/form.ts) for the create/update payload.
There is no persisted structure version property.

## Validation boundaries

`isFormStructure` checks:

- At least one page, with arrays for every page's sections and section's fields.
  Empty section and field arrays are allowed; the builder separately prevents
  saving a form with no fields.
- Non-empty string IDs, unique across all pages, sections, and fields in one form.
- String page/section titles and descriptions when provided.
- Field identifiers in the server-safe `KNOWN_FIELD_IDENTIFIERS` allow-list.
- Valid choice options for select/radio fields: string labels, nonblank option IDs
  and values, with unique IDs and values within the field.
- Valid server-safe cross-field constraints: numeric ranges and steps, slider
  defaults, multi-select selection bounds, and date/date-time ranges.
- Valid optional layout, theme, quiz settings, and per-field quiz configuration.

This is not exhaustive validation of every field's configuration or submitted
answer. The allow-list deliberately avoids importing the client field registry
into structural validation. When adding a field, update both the allow-list and
[elements/index.ts](elements/index.ts).

Field definitions own their answer schemas. The shared
[formValidation.ts](utils/formValidation.ts) dispatcher validates answers for
both the public form and submission API. Do not replace answer validation with
`isFormStructure`, or treat import sanitization as complete validation.

## Layout, theme, and quiz settings

- `layout` stores content/header alignment, content width, section spacing,
  submit alignment/width, and six spacing multipliers. Spacing values must be
  finite numbers from 0 through 16. Rendered gaps multiply the theme's CSS
  `--spacing` value. `normalizeFormLayout` fills omitted properties from
  `DEFAULT_FORM_LAYOUT`, including responsive submit-button width.
- `theme` uses [StoredFormTheme](theme.ts). Current themes store one `colors`
  palette plus typography, radius, spacing, and shadow settings. Legacy themes
  with `mode`, `light`, and `dark` remain readable. `normalizeFormTheme` selects
  their active palette; the builder saves the normalized single-palette shape.
  An absent theme preserves the default appearance.
- `quiz` stores enabled state and optional default points, grade-release policy,
  and recipient email field ID. Fields may have quiz points and supported answer
  keys. Structural validation checks their shape and supported answer values;
  it does not verify that the recipient ID references an email field.
- The public view removes each field's entire `quiz` property through
  `stripQuizAnswerKeys`. Server grading uses the stored tree, not answer keys
  supplied by the browser. Grade release can be immediate or after review.

## Ownership and data flow

| Owner | Responsibility |
| --- | --- |
| [form-structure.ts](form-structure.ts) | Shared types, factories, structural validation, ordered field projection, import field sanitization, and quiz helpers. |
| [theme.ts](theme.ts) | Theme validation, normalization, CSS tokens, and theme import/export. |
| [Builder container](../../containers/dashboard/builder/[slug]/index.tsx) | Editable tree, active page, form settings, customization draft, and save orchestration. |
| [Builder drag model](../../containers/dashboard/builder/[slug]/drag-model.ts) | Page/section/field operations and imported-page assembly; uses the shared structure types. |
| [Template instantiation](../../containers/dashboard/templates/instantiate-template.ts) | Materializes registry defaults and template overrides into a fresh tree for previews and builder creation. |
| [Public form container](../../containers/public/forms/[slug]/index.tsx) | Loads and validates the public tree, manages answers, page navigation, and submission. |
| [RespondentFormContent](components/respondent-form-content.tsx) | Renders the active page, its sections and fields, and navigation/submit controls. |

`createFormSection` and `createFormPage` generate IDs and accept child arrays.
`createFormStructure(fields)` creates one page containing one section.

`sanitizeImportedFields` drops unknown field types, repairs missing or duplicate
field IDs within the supplied list, and normalizes choice options. The builder
assembles imported pages into sections and rejects imports with no usable fields.
Sanitization does not replace validation of the final tree across all pages.

Public forms now support multiple pages. Next validates the active page before
advancing; Previous returns to earlier answers. Final submission validates all
fields. `getOrderedFormFields` still projects the whole tree in page, section,
then field array order for validation and other consumers. Do not flatten the
persisted tree or reorder it to match a display-only view.

Customization uses a temporary draft. Applying it writes theme/layout into the
tree and submit text into form settings; canceling discards it. Save includes the
visible draft. Mode and customization session IDs are UI state, not stored data.

## API boundaries

- [Create](../../routes/api/forms/new.ts) and
  [update](../../routes/api/forms/$id/update.ts) validate the payload and tree,
  returning HTTP 422 for invalid structure.
- [Duplicate](../../routes/api/forms/$id/duplicate.ts) rejects invalid stored
  structure. It copies the tree; IDs need to be unique within each form, not
  across different forms.
- [Owner read](../../routes/api/forms/$id.ts) returns the authorized owner's
  stored form without structural validation. The builder validates it on load
  and blocks saving an invalid tree.
- [Public view](../../routes/api/forms/$id/viewForm.ts) returns HTTP 422 for an
  invalid stored tree and strips field quiz metadata from valid responses.
- [Submit](../../routes/api/forms/$id/submit.ts) rejects invalid stored structure
  and invalid answers with HTTP 422 before creating a response. It validates
  against the stored fields and retains only submitted keys belonging to them.
  Upload receipts have additional server validation before persistence.

## Verification

Unit tests live beside source files, not in mirrored `tests/features/` folders:

- [form-structure.test.ts](form-structure.test.ts): factories, ordering, IDs,
  layout, quiz metadata, and imported fields.
- [theme.test.ts](theme.test.ts) and [formValidation.test.ts](formValidation.test.ts):
  theme compatibility and answer validation.
- [Builder drag tests](../../containers/dashboard/builder/[slug]/drag-model.test.ts)
  and [import tests](../../containers/dashboard/builder/[slug]/imported-google-form-structure.test.ts).
- API tests sit beside the handlers under `src/routes/api/forms/`.
- Browser tests live in [tests/visual](../../../tests/visual/), including builder
  customization, page tabs, section editing, and public-form cache behavior.

Before and after changing the contract, run the relevant unit tests with
`pnpm exec vitest run --project unit <test-paths>`. `pnpm test` runs the full unit
suite. Run relevant browser tests for interaction changes, plus the applicable
type check, build, lint, and `git diff --check` required by AGENTS.md.

Verify multi-page order and stable IDs through editing, saving, public navigation,
validation, and submission. Cover invalid stored JSON returning HTTP 422 without
a response write, legacy theme normalization, quiz answer-key stripping, and
customization mode changes preserving canvas state when those areas change.

Update triggers for this document: a new field identifier updates the allow-list
notes; a changed page/section/field shape, ID rule, layout, theme, or quiz setting
updates the contract section naming it; a changed producer, consumer, or API
behavior updates the ownership or API-boundary entry for it. Replace obsolete
statements in place and keep the AGENTS.md guides linked here free of copied
contract text.
