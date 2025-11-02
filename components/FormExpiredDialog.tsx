'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { CalendarX2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'

interface FormExpiredDialogProps {
  isOpen: boolean
  onClose: () => void
  expiresAt?: Date
  formTitle: string
  reason: 'expired' | 'max-submissions' | 'both'
}

export function FormExpiredDialog({
  isOpen,
  onClose,
  expiresAt,
  reason,
}: FormExpiredDialogProps) {
  const isMobile = useIsMobile()

  const getContent = () => {
    if (reason === 'max-submissions') {
      return (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <CheckCircle2 className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm">
              This form has reached its maximum submission limit and is now closed.
            </p>
            <p className="text-sm pt-2">
              Submissions are no longer being accepted. Please contact the form
              owner if you need to submit a response.
            </p>
          </div>
        </>
      )
    }
    
    if (reason === 'both' && expiresAt) {
      return (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <CalendarX2 className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm">
              This form expired on{' '}
              <span className="font-semibold text-foreground">
                {format(expiresAt, 'PPP')} at {format(expiresAt, 'p')}
              </span>
              {' '}and has also reached its maximum submission limit.
            </p>
            <p className="text-sm pt-2">
              Submissions are no longer being accepted. Please contact the form
              owner if you believe this is an error.
            </p>
          </div>
        </>
      )
    }
    
    // Default: expired
    return (
      <>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <CalendarX2 className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm">
            This form expired on{' '}
            <span className="font-semibold text-foreground">
              {expiresAt ? format(expiresAt, 'PPP') : 'N/A'} at {expiresAt ? format(expiresAt, 'p') : 'N/A'}
            </span>
          </p>
          <p className="text-sm pt-2">
            Submissions are no longer being accepted. Please contact the form
            owner if you believe this is an error.
          </p>
        </div>
      </>
    )
  }

  const getTitle = () => {
    if (reason === 'max-submissions') {
      return 'Form Is Closed'
    }
    return 'Form Has Expired'
  }

  const content = getContent()
  const title = getTitle()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            {content}
            <DrawerTitle className="text-center text-xl">
              {title}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              This form is no longer accepting submissions
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button onClick={onClose} variant="default" className="w-full">
                I Understand
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            {content}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onClose}
            variant="default"
            className="w-full sm:w-auto"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
