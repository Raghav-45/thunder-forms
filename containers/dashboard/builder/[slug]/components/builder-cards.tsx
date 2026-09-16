import { Button } from '@/components/ui/button'
import type { FieldConfig } from '@/features/form-builder/elements'
import { getFieldComponent } from '@/features/form-builder/utils/helperFunctions'
import { cn } from '@/lib/utils'
import {
  GripVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { createElement, forwardRef } from 'react'

type FieldPreviewComponent = ComponentType<{
  field: FieldConfig
  value: undefined
  onChange: (value: unknown) => void
}>

function FieldPreview({ field }: { field: FieldConfig }) {
  const FieldComponent = getFieldComponent(
    field.uniqueIdentifier,
  ) as unknown as FieldPreviewComponent

  return createElement(FieldComponent, {
    field: field as never,
    value: undefined,
    onChange: () => undefined,
  })
}

interface ItemCardProps {
  field: FieldConfig
  floatingWidth?: number | null
  onEdit?: () => void
  onRemove?: () => void
  state?: 'ghost' | 'floating'
}

export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(
  function ItemCard({ field, floatingWidth, onEdit, onRemove, state }, ref) {
    const isFloating = state === 'floating'

    return (
      <div
        ref={ref}
        style={isFloating && floatingWidth ? { width: floatingWidth } : undefined}
        className={cn(
          'group relative flex items-center justify-between rounded-lg border-2 border-dashed border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing',
          state === 'ghost' && 'opacity-30',
          isFloating && 'pointer-events-none shadow-2xl cursor-grabbing',
        )}
      >
        <div className="pointer-events-none flex-1 pr-2">
          <FieldPreview field={field} />
        </div>

        {!isFloating && onEdit && onRemove ? (
          <div
            className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary"
              onClick={onEdit}
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sr-only">Edit {field.label}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2Icon className="h-4 w-4" />
              <span className="sr-only">Remove {field.label}</span>
            </Button>
          </div>
        ) : null}
      </div>
    )
  },
)

interface SectionCardProps {
  children?: ReactNode
  fieldSurfaceRef?: (element: HTMLDivElement | null) => void
  floatingWidth?: number | null
  hasDragHandle?: boolean
  handleRef?: (element: Element | null) => void
  isEmpty: boolean
  label: string
  state?: 'ghost' | 'floating'
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard(
    {
      children,
      fieldSurfaceRef,
      floatingWidth,
      hasDragHandle,
      handleRef,
      isEmpty,
      label,
      state,
    },
    ref,
  ) {
    const isFloating = state === 'floating'

    return (
      <div
        ref={ref}
        style={isFloating && floatingWidth ? { width: floatingWidth } : undefined}
        className={cn(
          'flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-opacity',
          state === 'ghost' && 'opacity-30',
          isFloating && 'pointer-events-none shadow-2xl cursor-grabbing',
        )}
      >
        <div
          ref={handleRef}
          className={cn(
            'flex items-center gap-2 text-sm font-medium text-neutral-400',
            hasDragHandle && 'cursor-grab active:cursor-grabbing',
          )}
        >
          <GripVerticalIcon className="size-4" />
          <span>{label}</span>
        </div>

        {isEmpty ? (
          <div
            ref={fieldSurfaceRef}
            className="flex h-24 items-center justify-center rounded-lg border border-dashed border-neutral-800 text-sm text-neutral-500"
          >
            Drop fields here
          </div>
        ) : (
          <div ref={fieldSurfaceRef} className="flex-1 space-y-3">
            {children}
          </div>
        )}
      </div>
    )
  },
)
