import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export const DeleteFormDialog = ({
  deleteFormId,
  setDeleteFormId,
  afterFormDeleted,
}: {
  deleteFormId: string | null
  setDeleteFormId: (id: string | null) => void
  afterFormDeleted?: (id: string) => void
}) => {
  const handleDeleteForm = async () => {
    if (!deleteFormId) return

    const id = deleteFormId
    setDeleteFormId(null)

    const deletePromise = async () => {
      const response = await fetch(`/api/forms/${id}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete form')
      }

      return { id }
    }

    toast.promise(deletePromise(), {
      loading: 'Deleting form...',
      success: (data) => {
        afterFormDeleted?.(data.id)
        return 'Form deleted successfully'
      },
      error: 'Failed to delete form. Please try again.',
    })
  }

  return (
    <Dialog
      open={deleteFormId !== null}
      onOpenChange={(open) => !open && setDeleteFormId(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your form
            and data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteForm}
            className="cursor-pointer"
          >
            Confirm Deletion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
