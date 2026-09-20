'use client'

import { Button } from '@/components/ui/button'
import { chooseGoogleSpreadsheet } from '@/features/google-picker/client'
import type { GoogleSheetsIntegrationSummary } from '@/features/google-sheets/types'
import { Loader2, Pause, Play, Plus, Sheet, Unplug } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface IntegrationResponse {
  connection: { status: 'ACTIVE' | 'REAUTH_REQUIRED' } | null
  integration: GoogleSheetsIntegrationSummary | null
}

type IntegrationAction = 'choose' | 'connect' | 'create' | 'remove' | 'status'

function IntegrationHeader({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">Google Sheets</h1>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export function GoogleSheetsIntegration({ formId }: { formId: string | null }) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<IntegrationAction | null>(null)
  const queryKey = useMemo(
    () => ['google-sheets-integration', formId] as const,
    [formId],
  )
  const integration = useQuery({
    queryKey,
    enabled: Boolean(formId),
    queryFn: async () => {
      const { data } = await axios.get<IntegrationResponse>(
        `/api/forms/${formId}/integrations/google-sheets`,
      )
      return data
    },
  })

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  )

  const run = useCallback(
    async (name: IntegrationAction, task: () => Promise<void>) => {
      setAction(name)
      try {
        await task()
        await refresh()
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : error instanceof Error
              ? error.message
              : 'Google Sheets action failed'
        toast.error(message)
      } finally {
        setAction(null)
      }
    },
    [refresh],
  )

  if (!formId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Google Sheets</h1>
        <p className="text-sm text-muted-foreground">
          Save this form before connecting a response sheet.
        </p>
      </div>
    )
  }

  if (integration.isLoading) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />
  }

  const data = integration.data
  if (!data?.connection || data.connection.status === 'REAUTH_REQUIRED') {
    return (
      <div className="space-y-5">
        <IntegrationHeader>
          Send new responses to a Sheet you create or choose.
        </IntegrationHeader>
        <Button
          type="button"
          onClick={() =>
            run('connect', async () => {
              const { data: result } = await axios.post<{ authorizationUrl: string }>(
                `/api/forms/${formId}/integrations/google-sheets/connect`,
              )
              window.location.assign(result.authorizationUrl)
            })
          }
          disabled={Boolean(action)}
        >
          {action === 'connect' ? <Loader2 className="animate-spin" /> : <Sheet />}
          {data?.connection ? 'Reconnect Google' : 'Connect Google account'}
        </Button>
      </div>
    )
  }

  if (!data.integration) {
    return (
      <div className="space-y-5">
        <IntegrationHeader>
          Google connected. Choose where new responses go.
        </IntegrationHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() =>
              run('create', async () => {
                await axios.post(
                  `/api/forms/${formId}/integrations/google-sheets/create`,
                )
                toast.success('Response spreadsheet created')
              })
            }
            disabled={Boolean(action)}
          >
            {action === 'create' ? <Loader2 className="animate-spin" /> : <Plus />}
            Create response Sheet
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              run('choose', async () => {
                const { data: token } = await axios.get<{ accessToken: string }>(
                  `/api/forms/${formId}/integrations/google-sheets/picker-token`,
                )
                const spreadsheet = await chooseGoogleSpreadsheet(token.accessToken)
                if (!spreadsheet) return
                await axios.post(
                  `/api/forms/${formId}/integrations/google-sheets/selection`,
                  { spreadsheetId: spreadsheet.id },
                )
                toast.success('Response tab added to selected spreadsheet')
              })
            }
            disabled={Boolean(action)}
          >
            {action === 'choose' ? <Loader2 className="animate-spin" /> : <Sheet />}
            Choose existing Sheet
          </Button>
        </div>
      </div>
    )
  }

  const destination = data.integration
  const isPaused = destination.status === 'PAUSED'
  return (
    <div className="space-y-5">
      <IntegrationHeader>
        New responses sync to a ThunderForms-managed tab.
      </IntegrationHeader>
      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <a
          className="font-medium underline-offset-4 hover:underline"
          href={destination.spreadsheetUrl}
          rel="noreferrer"
          target="_blank"
        >
          {destination.spreadsheetTitle}
        </a>
        <p className="text-muted-foreground">Tab: {destination.sheetTitle}</p>
        <p className="text-muted-foreground">
          {destination.lastSyncedAt
            ? `Last synced ${new Date(destination.lastSyncedAt).toLocaleString()}`
            : 'Waiting for first response'}
        </p>
        {(destination.pendingCount > 0 || destination.failedCount > 0) && (
          <p className="text-muted-foreground">
            {destination.pendingCount} pending · {destination.failedCount} failed
          </p>
        )}
        {destination.lastError && (
          <p className="text-destructive">{destination.lastError}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(action)}
          onClick={() =>
            run('status', async () => {
              await axios.patch(`/api/forms/${formId}/integrations/google-sheets`, {
                status: isPaused ? 'ACTIVE' : 'PAUSED',
              })
            })
          }
        >
          {action === 'status' ? (
            <Loader2 className="animate-spin" />
          ) : isPaused ? (
            <Play />
          ) : (
            <Pause />
          )}
          {isPaused ? 'Resume sync' : 'Pause sync'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(action)}
          onClick={() =>
            run('remove', async () => {
              await axios.delete(`/api/forms/${formId}/integrations/google-sheets`)
              toast.success('Google Sheets destination removed')
            })
          }
        >
          {action === 'remove' ? <Loader2 className="animate-spin" /> : <Unplug />}
          Remove destination
        </Button>
      </div>
    </div>
  )
}
