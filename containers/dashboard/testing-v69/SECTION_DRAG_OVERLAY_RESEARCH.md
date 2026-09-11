# Section Drag Overlay Stability

## Finding

The section canvas must reorder during `onDragOver`, while its floating card
must represent one drag operation. Those are different views of state.

The reported field-order defect had a different root cause. Same-section field
drag used custom before/after placement. It derived placement from the dragged
source shape instead of the pointer position. dnd-kit therefore transformed the
visible list into `A-C-B`, while the stored tree remained `A-B-C`. A later
section drag correctly cloned that stored tree, exposing the divergence in its
floating card.

The overlay also needs a source-bound preview. Positional `Section N` labels
must follow dnd-kit's current sortable projection instead of a drag-start
ordinal, and a previous preview must never render under a new drag source.

## Final Model

| Concern | Owner | Behavior |
| --- | --- | --- |
| Same-section field order | `move(section.fields, event)` | Uses dnd-kit's sortable IDs and current operation. |
| Cross-section field order | `moveExistingField` | Uses target section and pointer placement. |
| Canvas order | `formStructure` | Live reorder during `onDragOver`; synchronous ref mirrors every mutation. |
| Cancel recovery | `formStructureSnapshot` | Restores drag-start tree only after cancellation/outside drop. |
| Floating field/section body | `dragPreview` | Immutable drag-start clone. |
| Floating section ordinal | dnd-kit sortable source index | Uses current drag projection, not delayed React state. |
| Preview ownership | `dragPreview` session, source ID, and source type | Overlay renders only for its matching active source in current drag session. |
| React subtree identity | `key` from drag session, type, and ID | Prevents a prior field renderer subtree from being reused for another drag. |

This keeps the existing Thunder Forms visual language: the source remains a
ghost, the canvas makes room live, and the floating component is the dragged
content at the current position. No new layout, color, or interaction surface
is introduced.

## Browser Verification

A real Chromium session signed in as the local QA user and loaded a fixture
with a first section containing `Alpha`, `Bravo`, and `Charlie`, plus a second
section. Pointer drags exercised the reported sequence.

- Dragging `Charlie` above `Bravo` committed canvas order
  `Alpha, Charlie, Bravo`.
- Immediately dragging that section rendered floating content
  `Alpha, Charlie, Bravo`.
- The assertion fails if the floating section contains the prior
  `Alpha, Bravo, Charlie` order.

The changing ordinal is expected: it is the dragged section's current canvas
position. The field body never changes to a sibling section.

## Acceptance Cases

1. Reorder fields within one section, then drag that section immediately.
2. Confirm floating field order equals committed canvas field order.
3. Drag each section through every position in both directions.
4. Start a new drag immediately after release; confirm no prior preview paints.
5. Cancel a drag and confirm original section order returns.

## Sources

1. dnd kit, [sortable tree example](https://github.com/clauderic/dnd-kit/blob/main/apps/stories/stories/react/Sortable/Tree/Tree.tsx), consulted through Context7 on 12 September 2026. It uses a separate `DragOverlay` for the active source while sortable state changes during drag events.
2. dnd kit, [transformed sortable example](https://github.com/clauderic/dnd-kit/blob/main/apps/stories/stories/react/Sortable/Transformed/TransformedExample.tsx), consulted through Context7 on 12 September 2026. It applies `move(items, event)` during `onDragOver` and renders the overlay separately from the live list.
