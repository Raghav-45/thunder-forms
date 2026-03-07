'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Copy,
  FileDown,
  Link,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { FC, useState } from 'react'
import { toast } from 'sonner'

const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL

interface ImportGoogleFormProps {
  onImported: (
    title: string,
    description: string,
    fields: FieldConfig[],
  ) => void
}

const ImportGoogleForm: FC<ImportGoogleFormProps> = ({ onImported }) => {
  const [url, setUrl] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) return
    navigator.clipboard.writeText(GOOGLE_SERVICE_ACCOUNT_EMAIL)
    setCopied(true)
    toast.success('Email copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleImport() {
    if (!url.trim()) {
      toast.error('Please enter a Google Forms URL')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/forms/import-google-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to import form')
      }

      const data = await res.json()
      onImported(
        data.title,
        data.description || '',
        data.fields as FieldConfig[],
      )

      if (data.skippedItems?.length > 0) {
        toast.warning(
          `Imported with ${data.skippedItems.length} skipped item(s)`,
          {
            description: data.skippedItems.join('\n'),
            style: { whiteSpace: 'pre-line' },
            duration: 8000,
          },
        )
      } else {
        toast.success(
          `Imported "${data.title}" with ${data.fields.length} field(s)`,
        )
      }

      setIsOpen(false)
      setUrl('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to import form',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const stepNumber = (n: number) => (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold shrink-0">
      {n}
    </div>
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setUrl('')
          setCopied(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer" variant="outline">
          <FileDown className="size-4" />
          Import from Google Forms
        </Button>
      </DialogTrigger>
      <DialogContent
        className="overflow-hidden p-0 gap-0 sm:max-w-[540px]"
        overlayClassName="bg-black/60 backdrop-blur-md"
      >
        <DialogHeader className="px-6 pt-6 pb-1 gap-0">
          <DialogTitle className="text-lg font-semibold">
            Import from Google Forms
          </DialogTitle>
          <DialogDescription>
            Migrate your existing Google Form to ThunderForms in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Share access */}
          {GOOGLE_SERVICE_ACCOUNT_EMAIL && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                {stepNumber(1)}
                <p className="text-sm font-medium">
                  Share access with ThunderForms
                </p>
              </div>

              <div className="ml-8 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Open your Google Form &rarr; <strong>three dots menu</strong>{' '}
                  &rarr; <strong>Add collaborators</strong> &rarr; paste the
                  email below and send.
                </p>
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 min-w-0">
                  <code className="text-xs font-mono flex-1 break-all select-all min-w-0">
                    {GOOGLE_SERVICE_ACCOUNT_EMAIL}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 cursor-pointer"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Paste URL */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              {stepNumber(GOOGLE_SERVICE_ACCOUNT_EMAIL ? 2 : 1)}
              <p className="text-sm font-medium">
                Paste the form&apos;s edit link
              </p>
            </div>

            <div className="ml-8 space-y-1.5">
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/.../edit"
                  className="pl-9 h-10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleImport()
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use the edit link from your browser address bar, not the sharing
                link.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-6 py-4 flex items-center justify-end">
          <Button
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className="text-xs cursor-pointer"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import Form
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportGoogleForm
