import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconDotsVertical } from '@tabler/icons-react'

interface FormTableActionsProps {
  formId: string
  isDuplicating: boolean
  onDuplicate: (formId: string) => void
  onDelete: (formId: string) => void
}

export function FormTableActions({
  formId,
  isDuplicating,
  onDuplicate,
  onDelete,
}: FormTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
          size="icon"
        >
          <IconDotsVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDuplicate(formId)}
          disabled={isDuplicating}
          className="cursor-pointer"
        >
          {isDuplicating ? 'Copying...' : 'Make a copy'}
        </DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(formId)}
          className="cursor-pointer"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
