# Templates: renderer and configuration parity

## Instruction navigation

Start with the [root guide and instruction index](../../../../AGENTS.md#required-instruction-discovery)
and complete its reading workflow before editing. This guide applies to
`src/containers/dashboard/templates/` and its descendants, supplementing the
[containers guide](../../AGENTS.md) and root rules.

## Template rules

Preserve the approved visual design, routes, and existing builder behavior.

- Render thumbnail and full-preview questions through the form-builder registry.
  Do not copy field JSX, build a mock renderer, or override constraints only in a
  preview. Shared renderer changes must reach templates, builder, and public forms.
- `instantiateTemplate` is the single materialization path for both previews and
  builder creation. Supported constraints belong in the template spec. Preserve
  zero values and registry defaults for settings the template does not override.
  When slider constraints change, clamp and snap the inherited initial value to
  the new range and step. Preserve valid explicit defaults; reject invalid ranges,
  steps, or explicit defaults rather than creating a form that fails validation.
- Customer Feedback uses min 0, max 10, step 1, and initial value 5. Instructions,
  rendered range, builder configuration, and validation must agree. Do not change
  the generic slider defaults or silently migrate previously saved forms.
- An omitted description means no helper text. Do not inherit generic descriptions
  that refer to a different question or imply unimplemented submission behavior.
- `previewFieldLabels` selects existing, uniquely named questions for thumbnails
  only. Keep full-preview and builder field order, options, and configuration intact.
  Thumbnail controls remain inert; preview answers remain local and never submit.
- Preserve stable, instance-scoped DOM IDs and accessible names on the actual
  interactive controls, including composite slider thumbs.
- Horizontally paired actions must share their height and alignment; retain 44px
  action and filter controls. Use mobile-only spacing/thumbnail changes to make
  the first action easier to reach, without changing the desktop composition.
- Verify narrow mobile, intermediate, and desktop layouts for overflow, paired
  action geometry, keyboard operation, dialog scrolling, and focus restoration.
- Add regression tests for renderer lookup, thumbnail selection, copy, configured
  ranges/defaults, validation boundaries, accessible names, and unique IDs. Run
  targeted tests, type check, build, lint, and `git diff --check` before finishing.
