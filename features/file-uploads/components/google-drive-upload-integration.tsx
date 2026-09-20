'use client'

import { Button } from '@/components/ui/button'
import { chooseGoogleDriveFolder } from '@/features/google-picker/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FolderUp, Loader2 } from 'lucide-react'
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

export function GoogleDriveUploadIntegration({ formId }: { formId: string | null }) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<'connect' | 'choose' | null>(null)
  const queryKey = useMemo(
    () => ['file-upload-integration', formId] as const,
    [formId],
  )
  const integration = useQuery({
    queryKey,
    enabled: Boolean(formId),
    queryFn: async () => {
      const { data } = await axios.get<UploadIntegrationResponse>(
        `/api/forms/${formId}/uploads/integration`,
      )
      return data
    },
  })

  const run = useCallback(async (name: 'connect' | 'choose', task: () => Promise<void>) => {
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
      <IntegrationHeader>
        Respondent files upload to your Google Drive folder “{data.destination.folderName}”.
      </IntegrationHeader>
    )
  }

  if (!data?.connection || data.connection.status === 'REAUTH_REQUIRED') {
    return (
      <div className="space-y-5">
        <IntegrationHeader>
          Connect Google Drive. ThunderForms creates one private folder for this form.
        </IntegrationHeader>
        <Button
          type="button"
          disabled={Boolean(action)}
          onClick={() => run('connect', async () => {
            const { data: result } = await axios.post<{ authorizationUrl: string }>(
              `/api/forms/${formId}/uploads/connect`,
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
        Choose a folder only you control. Public or domain-shared folders are blocked.
      </IntegrationHeader>
      <Button
        type="button"
        disabled={Boolean(action)}
        onClick={() => run('choose', async () => {
          const { data: token } = await axios.get<{ accessToken: string }>(
            `/api/forms/${formId}/uploads/picker-token`,
          )
          const folder = await chooseGoogleDriveFolder(token.accessToken)
          if (!folder) return
          await axios.post(`/api/forms/${formId}/uploads/selection`, {
            folderId: folder.id,
          })
          toast.success('Google Drive upload folder selected')
        })}
      >
        {action === 'choose' ? <Loader2 className="animate-spin" /> : <FolderUp />}
        Choose upload folder
      </Button>
    </div>
  )
}
