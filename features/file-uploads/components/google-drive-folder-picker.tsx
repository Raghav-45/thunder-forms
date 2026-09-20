'use client'

import { Button } from '@/components/ui/button'
import {
  chooseGoogleDriveFolder,
  waitForGooglePickerLayer,
} from '@/features/google-picker/client'
import axios from 'axios'
import { FolderOpen, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface GoogleDriveFolderPickerProps {
  formId: string
  fieldId: string
  disabled?: boolean
  onFolderSelected: () => Promise<unknown> | void
  onPickerOpenChange?: (isOpen: boolean) => void
}

export function GoogleDriveFolderPicker({
  formId,
  fieldId,
  disabled = false,
  onFolderSelected,
  onPickerOpenChange,
}: GoogleDriveFolderPickerProps) {
  const [isChoosing, setIsChoosing] = useState(false)

  async function chooseFolder() {
    setIsChoosing(true)
    try {
      const { data: token } = await axios.get<{ accessToken: string }>(
        `/api/forms/${formId}/uploads/fields/${fieldId}/picker-token`,
      )

      onPickerOpenChange?.(true)
      await waitForGooglePickerLayer()

      const folder = await chooseGoogleDriveFolder(token.accessToken)
      if (!folder) return

      await axios.post(`/api/forms/${formId}/uploads/fields/${fieldId}/selection`, {
        folderId: folder.id,
      })
      await onFolderSelected()
      toast.success('Google Drive upload folder selected')
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : error instanceof Error
            ? error.message
            : 'Google Drive folder selection failed',
      )
    } finally {
      onPickerOpenChange?.(false)
      setIsChoosing(false)
    }
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
          <FolderOpen className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">Google Drive folder</p>
          <p className="text-sm leading-5 text-muted-foreground">
            Choose the private folder where respondent files will be stored.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="flex max-w-sm items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Only folders you control can be selected.
        </p>
        <Button
          type="button"
          disabled={disabled || isChoosing}
          onClick={chooseFolder}
        >
          {isChoosing ? <Loader2 className="animate-spin" /> : <FolderOpen />}
          {isChoosing ? 'Opening Google Drive…' : 'Choose folder'}
        </Button>
      </div>
    </div>
  )
}
