# Testing v69 Drag-and-Drop Design

## Scope

`/dashboard/testing-v69` preserves the master builder's Settings, canvas,
available-fields palette, editable field previews, import, AI generation, and
save-as-new-form flow. The experiment changes only interaction plumbing:
sortable palette entries, live drag previews, pages, and sections.

Public-form layout stays intentionally unchanged. The public renderer and
submit endpoint read the persisted page/section tree as one ordered field
sequence, so a saved v69 form remains renderable and validatable without
adding a second respondent navigation model.

## Upstream Builder Baseline

The upstream builder establishes a three-column workflow: Settings on the
left, a central Builder canvas, and Available Fields on the right. It also
establishes editable preview cards, a dashed empty canvas, save behavior, and
the field registry as the source of available field types.^1

v69 retains those surfaces. It adds page tabs and section cards and persists
the builder structure as `pages[].sections[].fields`. The public form consumes
the same fields in stable page/section order until a dedicated respondent-page
flow is designed.

## Drag-and-Drop Contract

The sortable-list documentation uses stable item IDs, list indexes, and groups.
Items move during drag-over so nearby items visibly make room; a drag overlay
renders a separate floating clone while the source remains in the list.^2

v69 applies those rules as follows:

1. Field and section IDs remain stable across drag-over events.
2. Existing fields and sections update their order live during drag-over.
3. Palette entries are source-only. A palette drag owns one minted clone for
   its entire lifetime; the palette list itself never changes.
4. The original source or staged clone remains as an opacity ghost. The
   `DragOverlay` owns the floating preview.
5. Field overlay width comes from the target section's real field surface.
   It does not use an offset or guessed canvas width.
6. The canvas is one persistent droppable element. Its empty message changes
   as content appears, but its target does not unmount during the first drop.
7. Cancelled drags and outside drops restore the drag-start snapshot.
8. Drag operations are page-local. Changing pages changes only the visible
   page's section tree.

## Interaction Acceptance Checks

- Drag a palette field into an empty canvas. It creates one section and stays
  after release.
- Drag a palette section into an empty canvas. It stays after release.
- Drag a palette field into an empty section. It appears in that section.
- Drag a field over another field. Both insertion ghost and floating card stay
  visible at full target-surface width.
- Drag a field across sections. The source section and target section update
  live.
- Drag a section over another section. Section order updates live.
- Drop any active item outside canvas or cancel it. The page returns to its
  drag-start order.
- Add a page, then repeat all page-local drag cases without changing another
  page.
- Edit or remove a field after it moves between sections. The action affects
  the field's actual page and section, not a selected-index shortcut.
- Save a multi-page form, open its public URL, and submit it. Fields render and
  validate in the same page/section order used by the builder.

## Sources

1. Raghav-45, [Thunder Forms master builder page](https://github.com/Raghav-45/thunder-forms/blob/master/app/%28builder%29/dashboard/builder/%5Bslug%5D/page.tsx).
2. dnd kit, [sortable concepts](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/concepts/sortable.mdx); [useSortable](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/hooks/use-sortable.mdx); [DragDropProvider](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/components/drag-drop-provider.mdx).
