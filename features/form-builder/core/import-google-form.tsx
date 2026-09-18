'use client'

import type { FieldConfig } from '@/features/form-builder/elements'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowRight,
  FileDown,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface ImportGoogleFormProps {
  onImported: (
    title: string,
    description: string,
    fields: FieldConfig[],
  ) => void
}

interface GoogleFormSummary {
  id: string
  title: string
  modifiedTime: string | null
  ownedByMe: boolean
}

interface GoogleFormsListResponse {
  forms: GoogleFormSummary[]
  nextPageToken: string | null
}

interface GoogleFormsImportResponse {
  title: string
  description: string
  fields: FieldConfig[]
  skippedItems: string[]
}

function formatModifiedTime(value: string | null): string {
  if (!value) return 'Last edited date unavailable'
  return `Last edited ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))}`
}

const ImportGoogleForm: FC<ImportGoogleFormProps> = ({ onImported }) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleFormsImportResult = searchParams.get('googleFormsImport')
  const [isOpen, setIsOpen] = useState(false)
  const [forms, setForms] = useState<GoogleFormSummary[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [hasAuthorization, setHasAuthorization] = useState<boolean | null>(null)
  const [isLoadingForms, setIsLoadingForms] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [importingFormId, setImportingFormId] = useState<string | null>(null)

  const loadForms = useCallback(async (pageToken?: string) => {
    setIsLoadingForms(true)
    try {
      const query = pageToken
        ? `?${new URLSearchParams({ pageToken }).toString()}`
        : ''
      const response = await fetch(`/api/forms/import-google-form${query}`)
      if (response.status === 401) {
        setHasAuthorization(false)
        setForms([])
        setNextPageToken(null)
        return
      }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Could not load Google Forms')
      }

      const data = await response.json() as GoogleFormsListResponse
      setHasAuthorization(true)
      setForms((current) => pageToken ? [...current, ...data.forms] : data.forms)
      setNextPageToken(data.nextPageToken)
    } catch (error) {
      setHasAuthorization(false)
      toast.error(
        error instanceof Error ? error.message : 'Could not load Google Forms',
      )
    } finally {
      setIsLoadingForms(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    void loadForms()
  }, [isOpen, loadForms])

  useEffect(() => {
    if (!googleFormsImportResult) return

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('googleFormsImport')
    router.replace(`${pathname}${nextParams.size ? `?${nextParams}` : ''}`)

    if (googleFormsImportResult === 'connected') {
      setIsOpen(true)
      toast.success('Google Forms ready to import')
      return
    }

    toast.error(
      googleFormsImportResult === 'denied'
        ? 'Google access was not granted'
        : 'Could not connect to Google Forms',
    )
  }, [googleFormsImportResult, pathname, router, searchParams])

  async function connectGoogle() {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/forms/import-google-form/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: pathname }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Could not start Google authorization')
      }

      const { authorizationUrl } = await response.json() as {
        authorizationUrl: string
      }
      window.location.assign(authorizationUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not start Google authorization',
      )
      setIsConnecting(false)
    }
  }

  async function importSelectedForm(form: GoogleFormSummary) {
    setImportingFormId(form.id)
    try {
      const response = await fetch('/api/forms/import-google-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form.id }),
      })
      if (response.status === 401) {
        setHasAuthorization(false)
      }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Could not import Google Form')
      }

      const data = await response.json() as GoogleFormsImportResponse
      onImported(data.title, data.description || '', data.fields)
      setIsOpen(false)
      setForms([])
      setNextPageToken(null)
      setHasAuthorization(false)

      if (data.skippedItems.length > 0) {
        toast.warning(`Imported with ${data.skippedItems.length} skipped item(s)`, {
          description: data.skippedItems.join('\n'),
          style: { whiteSpace: 'pre-line' },
          duration: 8_000,
        })
      } else {
        toast.success(`Imported “${data.title}” with ${data.fields.length} field(s)`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not import Google Form',
      )
    } finally {
      setImportingFormId(null)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setImportingFormId(null)
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer" variant="outline">
          <FileDown className="size-4" />
          Import from Google Forms
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[580px]">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Import a Google Form
          </DialogTitle>
          <DialogDescription className="max-w-md">
            Choose an existing form and copy its supported questions into this builder.
          </DialogDescription>
        </DialogHeader>

        {hasAuthorization === false ? (
          <div className="space-y-5 px-6 py-7">
            <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <p className="font-medium">Browse your Google Forms</p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                ThunderForms will show the forms you can access, then read only
                the one you select. It does not save a reusable Google connection.
              </p>
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={connectGoogle}
              disabled={isConnecting}
            >
              {isConnecting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              {isConnecting ? 'Opening Google…' : 'Browse my Google Forms'}
            </Button>
          </div>
        ) : isLoadingForms && hasAuthorization === null ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Choose a form to import</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => void loadForms()}
                disabled={isLoadingForms || importingFormId !== null}
              >
                <RefreshCw className={isLoadingForms ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>

            {forms.length === 0 && !isLoadingForms ? (
              <div className="rounded-lg border border-dashed px-5 py-10 text-center">
                <p className="text-sm font-medium">No Google Forms found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a form in Google Forms, or check that you are using the right Google account.
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] divide-y overflow-y-auto rounded-lg border">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{form.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatModifiedTime(form.modifiedTime)}
                        {form.ownedByMe ? ' · Owned by you' : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 cursor-pointer"
                      onClick={() => void importSelectedForm(form)}
                      disabled={importingFormId !== null}
                    >
                      {importingFormId === form.id ? (
                        <Loader2 className="animate-spin" />
                      ) : null}
                      Import
                    </Button>
                  </div>
                ))}
                {isLoadingForms ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
              </div>
            )}

            {nextPageToken ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full cursor-pointer"
                onClick={() => void loadForms(nextPageToken)}
                disabled={isLoadingForms || importingFormId !== null}
              >
                Load more forms
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportGoogleForm
