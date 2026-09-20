'use client'

import { Button } from '@/components/ui/button'
import { GoogleDriveFolderPicker } from './google-drive-folder-picker'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle2, FolderUp, Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

interface UploadIntegrationResponse {
  connection: { status: 'ACTIVE' | 'REAUTH_REQUIRED' } | null
  destination: { folderName: string } | null
  ready: boolean
}

function IntegrationHeader({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">File uploads</h1>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export function GoogleDriveUploadIntegration({
  formId,
  fieldId,
  onPickerOpenChange,
}: {
  formId: string | null
  fieldId: string
  onPickerOpenChange?: (isOpen: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<'connect' | null>(null)
  const queryKey = useMemo(
    () => ['file-upload-integration', formId, fieldId] as const,
    [fieldId, formId],
  )
  const integration = useQuery({
    queryKey,
    enabled: Boolean(formId),
    queryFn: async () => {
      const { data } = await axios.get<UploadIntegrationResponse>(
        `/api/forms/${formId}/uploads/fields/${fieldId}/integration`,
      )
      return data
    },
  })

  const run = useCallback(async (name: 'connect', task: () => Promise<void>) => {
    setAction(name)
    try {
      await task()
      await queryClient.invalidateQueries({ queryKey })
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : error instanceof Error
            ? error.message
            : 'Google Drive setup failed',
      )
    } finally {
      setAction(null)
    }
  }, [queryClient, queryKey])

  if (!formId) {
    return (
      <IntegrationHeader>Save this form before connecting Google Drive.</IntegrationHeader>
    )
  }

  if (integration.isLoading) return <Loader2 className="size-5 animate-spin text-muted-foreground" />

  const data = integration.data
  if (data?.ready && data.destination) {
    return (
      <div className="space-y-5">
        <IntegrationHeader>
          Respondent files upload directly to the folder you selected.
        </IntegrationHeader>
        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-medium">{data.destination.folderName}</p>
            <p className="text-muted-foreground">Google Drive upload destination</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.connection || data.connection.status === 'REAUTH_REQUIRED') {
    return (
      <div className="space-y-5">
        <IntegrationHeader>
          Connect the Google account that owns the upload destination.
        </IntegrationHeader>
        <Button
          type="button"
          disabled={Boolean(action)}
          onClick={() => run('connect', async () => {
            const { data: result } = await axios.post<{ authorizationUrl: string }>(
              `/api/forms/${formId}/uploads/fields/${fieldId}/connect`,
            )
            window.location.assign(result.authorizationUrl)
          })}
        >
          {action === 'connect' ? <Loader2 className="animate-spin" /> : <FolderUp />}
          {data?.connection ? 'Reconnect Google Drive' : 'Connect Google Drive'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <IntegrationHeader>
        Choose where respondent files are stored. A destination is required
        before this field can receive uploads.
      </IntegrationHeader>
      <GoogleDriveFolderPicker
        fieldId={fieldId}
        formId={formId}
        disabled={Boolean(action)}
        onFolderSelected={() => queryClient.invalidateQueries({ queryKey })}
        onPickerOpenChange={onPickerOpenChange}
      />
    </div>
  )
}
