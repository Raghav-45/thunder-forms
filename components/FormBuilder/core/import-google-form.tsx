'use client'

import { FieldConfig } from '@/components/FormBuilder/elements'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, FileDown, AlertCircle } from 'lucide-react'
import { FC, useState } from 'react'
import { toast } from 'sonner'

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL

interface ImportGoogleFormProps {
  onImported: (
    title: string,
    description: string,
    fields: FieldConfig[]
  ) => void
}

const ImportGoogleForm: FC<ImportGoogleFormProps> = ({ onImported }) => {
  const [url, setUrl] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      onImported(data.title, data.description || '', data.fields as FieldConfig[])

      if (data.skippedItems?.length > 0) {
        toast.warning(`Imported with ${data.skippedItems.length} skipped item(s)`, {
          description: data.skippedItems.join('\n'),
          style: { whiteSpace: 'pre-line' },
          duration: 8000,
        })
      } else {
        toast.success(`Imported "${data.title}" with ${data.fields.length} field(s)`)
      }

      setIsOpen(false)
      setUrl('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import form')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer" variant="outline">
          <FileDown className="size-4" />
          Import from Google Forms
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>Import from Google Forms</DialogTitle>
          <DialogDescription>
            Paste a Google Forms URL to import all questions into ThunderForms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {GOOGLE_SERVICE_ACCOUNT_EMAIL && (
            <div className="rounded-md bg-muted/50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">First, share the form with this email:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background rounded px-2 py-1 break-all">
                      {GOOGLE_SERVICE_ACCOUNT_EMAIL}
                    </code>
                    <button
                      type="button"
                      className="shrink-0 hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(GOOGLE_SERVICE_ACCOUNT_EMAIL)
                        toast.success('Email copied to clipboard')
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5">
                    Open your Google Form, click the <strong>three dots menu</strong> → <strong>Add collaborators</strong> → paste this email.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="googleFormUrl">Google Form URL</Label>
            <Input
              id="googleFormUrl"
              type="url"
              placeholder="https://docs.google.com/forms/d/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleImport()
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleImport}
              disabled={isLoading || !url.trim()}
              className="cursor-pointer"
            >
              {isLoading ? 'Importing...' : 'Import Form'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportGoogleForm
