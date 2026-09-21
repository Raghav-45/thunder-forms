'use client'

import { LoginForm } from '@/containers/auth/components/login-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

export function SaveFormLoginDialog({
  open,
  onOpenChange,
  onSignedIn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignedIn: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card p-0 sm:max-w-sm"
      >
        <DialogTitle className="sr-only">Sign in to save your form</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in without leaving your unfinished form.
        </DialogDescription>
        <LoginForm
          className="gap-0 [&>div:first-child]:rounded-b-none [&>div:first-child]:border-0 [&>div:first-child]:shadow-none [&>div:last-child]:px-6 [&>div:last-child]:pb-6"
          onSuccess={() => {
            onOpenChange(false)
            onSignedIn()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
