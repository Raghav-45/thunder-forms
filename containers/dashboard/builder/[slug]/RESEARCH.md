# Builder Adoption Research

## Decision

The production builder at `/dashboard/builder/[slug]` now uses this
implementation. v69 was selected because it keeps the established builder
surfaces while providing a complete page → section → field model and a more
reliable drag interaction. The former `testing*` routes are retired.

## Evidence and Parity

The upstream Thunder Forms master builder establishes the product contract:
dynamic form identity, existing-form loading, create/update persistence,
settings, field editing, import, AI generation, share link, and the
three-column workflow.^1 This implementation keeps those contracts:

| Contract | Production behavior |
| --- | --- |
| New form | `/dashboard/builder/new-form` creates through `/api/forms/new`, then changes the URL to the new ID. |
| Existing form | `/dashboard/builder/[id]` loads, validates, hydrates, and updates through `/api/forms/[id]/update`. |
| Templates | The gallery opens `/dashboard/builder/new-form?template=…`; the selected template initializes the editor. |
| Sharing | Saved forms expose the existing public-form copy link. |
| Invalid data | Saving is blocked and the builder explains that the canonical structure is invalid. |
| Editor tools | Settings, editable field previews, field palette, Google import, and AI generation remain available. |

The public renderer consumes the persisted tree as one ordered field sequence.
Respondent page navigation is intentionally out of scope; it needs its own UX
design instead of silently changing the public form contract.

## Drag-and-Drop Contract

dnd kit’s sortable guidance relies on stable item IDs, explicit sortable
groups, movement during drag-over, and a separate drag overlay for the floating
preview.^2

v69 applies those rules as follows:

1. Field and section IDs remain stable across drag-over events.
2. Existing fields and sections update their order live during drag-over.
3. Palette entries are source-only. A palette drag owns one minted clone for
   its entire lifetime; the palette list itself never changes.
4. The original source or staged clone remains as an opacity ghost; the
   `DragOverlay` owns the floating preview.
5. Field overlay width comes from the target section's real field surface, not
   an offset or guessed canvas width.
6. The canvas is one persistent droppable element. Its empty message changes
   as content appears, but its target does not unmount during the first drop.
7. Cancelled drags and outside drops restore the drag-start snapshot.
8. Drag operations are page-local. Changing pages changes only the visible
   page's section tree.

## Acceptance Checks

- Create a form, save it, reload its builder URL, edit it, and save again.
- Start from every template card and save the resulting form.
- Copy the public link for a saved form and complete it successfully.
- Drag fields and sections into an empty canvas, empty sections, and across
  sections; confirm the ghost and full-width overlay remain stable.
- Cancel a field, section, and palette drag; confirm no unintended move stays.
- Add a page and confirm its drag operations cannot reorder another page.

## Sources

1. Raghav-45, [Thunder Forms master builder page](https://github.com/Raghav-45/thunder-forms/blob/master/app/%28builder%29/dashboard/builder/%5Bslug%5D/page.tsx).
2. dnd kit, [sortable concepts](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/concepts/sortable.mdx); [useSortable](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/hooks/use-sortable.mdx); [DragDropProvider](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/components/drag-drop-provider.mdx).
