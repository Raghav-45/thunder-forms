# Field implementation guide

This directory contains the source-of-truth definitions for the form-builder's
answerable fields. A new field is not complete because it renders in the
builder: it must have a stable persisted configuration, a respondent-facing
renderer, an editor that can safely change that configuration, and server-side
validation that agree about the answer shape.

Keep a field in one `*.tsx` file when those concerns remain understandable
together. Do not split a field into a folder merely to make the tree look more
structured. Extract a local helper or a separate module only when it has a
clear single responsibility or is genuinely reused by more than one field.

## Read before changing anything

Before adding or changing a field, read:

1. `AGENTS.md` files from the repository root through this directory.
2. `../base.ts` and `../../types/index.ts` for the field contract.
3. At least three existing fields of the closest kind:
   - a simple scalar field (`text-input`, `number-input`, `slider`),
   - a choice field (`single-select`, `multi-select`, `radio-group`),
   - or a specialised field (`date-picker`, `datetime-picker`,
     `time-picker`, `file-upload`, `rating`).
4. `../index.ts`, `../../form-structure.ts`, and
   `../../utils/formValidation.ts` before registering a new identifier.
5. The caller or integration that motivated the field. Do not infer its
   answer format from the field name alone.

Use the code already here as the visual and interaction baseline. Do not
"modernise" adjacent fields as collateral work.

## The required field contract

Every answerable field in this directory exports a `FormFieldDefinition` with:

- one immutable, kebab-case `uniqueIdentifier`;
- a strongly typed config interface extending `BaseFieldConfig`;
- a respondent renderer assigned to `component`;
- a configuration-sheet component assigned to `editor`;
- `defaultConfig()` that produces a complete, usable configuration; and
- `getValidationSchema(field)` that validates the exact answer emitted by the
  renderer.

Co-locate the config type, renderer, editor, small field-only helpers, and
definition in the field file. Put reusable domain logic in a shared feature
location only after a second consumer proves that it is shared.

### Configuration and answer data

- Persist only JSON-safe configuration and answer values: strings, numbers,
  booleans, arrays, and plain objects. Never put React nodes, `File` objects,
  `Date` objects, functions, or component state in a field config.
- The identifier is a storage/API contract. Never rename or recycle it. A
  new semantic field gets a new identifier.
- `defaultConfig()` must create a fresh ID with `crypto.randomUUID()` and a
  readable field prefix. Defaults must be immediately renderable and valid.
- Model the canonical answer, not the browser control's incidental value. For
  example, a choice field stores stable option values, a rating stores a
  number, and a time field stores its documented string format.
- The renderer receives the current answer through `value` and changes it only
  through `onChange`. Do not duplicate submitted-answer state locally. Local
  state is appropriate only for transient UI such as an open popover, hover
  preview, or upload progress.
- Be defensive with malformed persisted configuration and values. Give safe
  defaults at render time for optional settings, but do not silently turn
  unsupported data into a different field or answer.

## Respondent renderer rules

The renderer is used outside the editor as well as in builder previews. It
must behave as a real form control, not as a decorative mockup.

- Use the existing shadcn primitives from `@/components/ui`; do not modify a
  primitive to accommodate one field.
- Use `field-${field.id}` as the base DOM ID. Labels must point at the real
  control, or use a semantic `fieldset` and `legend` for a group of controls.
- Show a required marker consistently with existing fields. Apply `disabled`
  to the actual interactive control(s), never merely a dimmed wrapper.
- Pass `onBlur` through when the control supports it. Preserve keyboard and
  screen-reader access; an icon-only or visual rating choice still needs a
  real focusable control and an accessible label.
- When there is an error, connect the control/group to a stable
  `${fieldId}-error` element via `aria-describedby` where supported; render
  that message with `role="alert"`. Make the control's error state visible,
  typically with the established red border treatment.
- Render the optional description beneath the control using
  `text-sm text-muted-foreground`, and errors using `text-sm text-red-500`.
  Do not invent a competing information hierarchy.
- The usual layout is `space-y-2`, a `text-sm font-medium` label, a full-width
  control, then description/error. A different structure is justified only
  when the control needs it (for example, a switch card or a rating group).
- Keep controls responsive. Do not rely on fixed canvas widths, hover-only
  interactions, or pointer-only drag behaviour.

## Editor rules

Each field editor is a compact, save-or-cancel configuration sheet—not a
second form-builder or a place for every imaginable option.

- Use the existing `Sheet`, with `SheetContent` using
  `sm:max-w-md overflow-y-auto gap-y-0` (class order is unimportant). Retain a
  header, a title in the form `Configure <field name>`, and a footer with
  Cancel and Save Changes.
- Start with `Basic Properties` open in a multi-select `Accordion`. Keep
  field-specific behaviour in a clearly named additional accordion (for
  example, `Range Settings` or `Rating Appearance`) and keep
  `Validation Properties` last.
- Basic properties always include a non-empty `Field Label`. Put placeholder,
  description, unit text, or similar optional copy behind
  `AccordionWithSwitch` when the setting is genuinely optional. Do not add a
  switch just to follow a pattern: a core field setting should remain directly
  visible.
- Put `Required Field` and `Disabled` in Validation Properties as labelled
  `Switch` controls. Put constraints beside their related validation settings.
- Use a component-local draft (`useState(field)`). Save calls `onUpdate(draft)`
  and closes; Cancel discards the draft and closes. Disable Save when
  `label.trim()` is empty. If the sheet can be dismissed by its overlay or
  escape key, it must behave like Cancel, not an implicit Save.
- A configuration change that invalidates another setting must resolve it in
  the draft immediately and visibly. Example: changing a field mode can clear
  constraints that no longer apply. Never leave an impossible combination for
  the renderer or schema to guess about.
- Namespace new editor DOM IDs with the field identifier (for example,
  `rating-label`, `rating-required`). Existing generic IDs are legacy; do not
  copy them into new fields because multiple editors may be mounted over time.
- For editable option lists, preserve stable option values while labels change.
  Use the established dnd-kit sortable pattern only when ordering has product
  meaning. Buttons need accessible names, and an option list must remain
  usable without dragging.
- Integrations or network actions in an editor are exceptional. They must be
  clearly scoped to the field, work with the builder's modal stack, handle
  loading/error/retry states, and never require a persisted form before the
  feature can explain why it is unavailable.

## Validation rules

Validation is part of the field's public behaviour. The renderer, editor,
schema, client validation, API, imports, and exports must agree on it.

- Build the schema from the saved field config in `getValidationSchema`.
  Return a required schema only when `field.required` is true; otherwise
  return the optional equivalent.
- Match the value emitted by `onChange` exactly. Do not validate a display
  label when the renderer submits an option value, or validate a number when
  the renderer emits a string.
- Enforce meaningful invariants at the schema boundary: option membership,
  min/max, allowed step values, and mutually dependent settings. Give people
  clear, field-specific error messages.
- Account for the generic empty-value handling in
  `utils/formValidation.ts`; optional fields should not fail merely because a
  respondent did not answer them. Required booleans need intentional handling
  because `false` is a valid answer, not emptiness.
- Do not trust client-side HTML constraints as validation. Server submission
  uses the field definition too.

## Adding a new field: integration checklist

Adding the file alone deliberately does nothing. Make each of these changes
only when it applies to the new field:

1. Add the definition instance to `../index.ts` so it appears in the registry,
   palette, renderer lookup, editor lookup, and schema lookup.
2. Add its identifier to `../../form-structure.ts` so persisted response
   values can be recognised safely on the server.
3. Update `app/api/generatewithai/prompt.ts` only when AI generation can
   express the new field faithfully. Include concrete configuration limits;
   never ask AI to invent an unsupported shape.
4. Update an importer (for example, Google Forms) only when there is a direct,
   loss-aware semantic mapping. Preserve what cannot be represented as an
   explicit skip/warning rather than pretending an unrelated field is equal.
5. If this field initiates uploads or another external operation, follow that
   feature's server contract, ownership checks, limits, and error model. Do
   not reproduce those rules in the renderer.

Avoid a parallel registry, a hard-coded renderer switch in a route, or a
client-only validation exception. Those bypass the field system and always
become a future migration bug.

## Testing and verification

Tests are required for the field's behaviour, not just its existence.

- Update `tests/features/form-builder/formValidation.test.ts` with a required
  valid answer, optional empty answer, valid boundary answer, and invalid
  boundary/value for every new constraint.
- Update importer tests when the field has an import mapping. Test the source
  representation and the resulting config, including clamps/defaults and
  unsupported cases.
- For complex interaction (keyboard selection, half-step rating, sortable
  options, uploads), add a focused component or browser test where the schema
  alone cannot prove the user experience. Test disabled and error states.
- Check registry defaults through the existing registry/default tests; every
  registered definition must create a renderable, serializable config.
- Run targeted tests first, then the repository's applicable lint, type check,
  build, and `git diff --check`. Manually verify the field in both builder
  preview and a public form, including keyboard navigation and a failed
  submission.

## Keep the implementation human-maintainable

- Prefer a small, explicit helper over clever generic machinery.
- Use `type` imports for type-only imports. Do not introduce `any` to force a
  field through the registry.
- Keep constants next to the field when they describe only that field; move
  them to an existing constants location only after real reuse.
- Do not change `components/ui`, refactor unrelated fields, rename existing
  identifiers, or create wrappers/barrels solely for aesthetic consistency.
- Before finishing, read the diff as a product change: a new field should have
  one answer model, one editor model, clear accessibility, clear validation,
  and no hidden effect on other fields.
