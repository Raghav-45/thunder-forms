'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import AccordionWithSwitch from '@/features/form-builder/components/accordion-with-switch'
import { FormFieldDefinition } from '@/features/form-builder/elements/base'
import type {
  BaseFieldConfig,
  EditorProps,
  FieldProps,
} from '@/features/form-builder/types/types'
import {
  isFileUploadReceiptList,
  type FileUploadReceipt,
} from '@/features/file-uploads/types'
import { FileUp, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const FIELD_IDENTIFIER = 'file-upload'
const DEFAULT_MAX_SIZE_BYTES = 4 * 1024 * 1024

export interface FileUploadConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  acceptedTypes?: string
  maxFiles?: number
  maxSizeBytes?: number
}

function maxFiles(field: FileUploadConfig) {
  return Math.min(Math.max(field.maxFiles ?? 1, 1), 10)
}

function maxSizeBytes(field: FileUploadConfig) {
  return Math.min(
    Math.max(field.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES, 1),
    DEFAULT_MAX_SIZE_BYTES,
  )
}

function formatSize(bytes: number) {
  return `${Math.ceil(bytes / (1024 * 1024))} MB`
}

const FileUploadComponent = ({
  field,
  value,
  onChange,
  error,
  formId,
}: FieldProps<FileUploadConfig>) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const files = isFileUploadReceiptList(value) ? value : []
  const limit = maxFiles(field)
  const sizeLimit = maxSizeBytes(field)

  const uploadFiles = async (selectedFiles: File[]) => {
    if (!formId || selectedFiles.length === 0) return

    const remaining = limit - files.length
    const candidates = selectedFiles.slice(0, remaining)
    if (candidates.length === 0) return

    const invalidFile = candidates.find((file) => file.size > sizeLimit)
    if (invalidFile) {
      setUploadError(`${invalidFile.name} is larger than ${formatSize(sizeLimit)}`)
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      const uploaded: FileUploadReceipt[] = []
      for (const file of candidates) {
        const data = new FormData()
        data.set('fieldId', field.id)
        data.set('file', file)
        const response = await fetch(`/api/forms/${formId}/uploads`, {
          method: 'POST',
          body: data,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'File upload failed')
        uploaded.push(result.upload)
      }
      onChange([...files, ...uploaded])
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : 'File upload failed',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={`field-${field.id}`}
        className={field.required ? "after:ml-1 after:text-red-500 after:content-['*']" : ''}
      >
        {field.label}
      </Label>
      {field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
      <Input
        id={`field-${field.id}`}
        type="file"
        accept={field.acceptedTypes}
        multiple={limit > 1}
        disabled={field.disabled || isUploading || files.length >= limit || !formId}
        onChange={(event) => {
          void uploadFiles(Array.from(event.currentTarget.files || []))
          event.currentTarget.value = ''
        }}
      />
      <p className="text-xs text-muted-foreground">
        Up to {limit} file{limit === 1 ? '' : 's'}, {formatSize(sizeLimit)} each.
      </p>
      {isUploading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Uploading file…
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul className="space-y-2" aria-label="Uploaded files">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={field.disabled || isUploading}
                onClick={() => onChange(files.filter((item) => item.id !== file.id))}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {uploadError || error ? (
        <p className="text-sm text-red-500" role="alert">
          {uploadError || error}
        </p>
      ) : null}
    </div>
  )
}

const FileUploadEditor = ({
  field,
  onUpdate,
  onClose,
  isOpen,
}: EditorProps<FileUploadConfig> & { isOpen: boolean }) => {
  const [config, setConfig] = useState(field)

  const update = (key: keyof FileUploadConfig, value: unknown) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="gap-y-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg">Configure File Upload</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload-label">Field Label *</Label>
            <Input
              id="file-upload-label"
              value={config.label}
              onChange={(event) => update('label', event.target.value)}
            />
          </div>
          <AccordionWithSwitch text="Description" defaultOpen={!!config.description}>
            <Textarea
              value={config.description || ''}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Tell respondents what to upload"
              rows={3}
            />
          </AccordionWithSwitch>
          <div className="space-y-2">
            <Label htmlFor="file-upload-types">Accepted file types</Label>
            <Input
              id="file-upload-types"
              value={config.acceptedTypes || ''}
              onChange={(event) => update('acceptedTypes', event.target.value)}
              placeholder="image/*,.pdf"
            />
            <p className="text-xs text-muted-foreground">Leave empty to allow every file type.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload-count">Maximum files</Label>
              <Input
                id="file-upload-count"
                type="number"
                min="1"
                max="10"
                value={maxFiles(config)}
                onChange={(event) => update('maxFiles', Number(event.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload-size">Maximum size (MB)</Label>
              <Input
                id="file-upload-size"
                type="number"
                min="1"
                max="4"
                value={Math.round(maxSizeBytes(config) / (1024 * 1024))}
                onChange={(event) => update('maxSizeBytes', (Number(event.target.value) || 1) * 1024 * 1024)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload-required">Required field</Label>
            <Switch
              id="file-upload-required"
              checked={config.required || false}
              onCheckedChange={(checked) => update('required', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload-disabled">Disabled</Label>
            <Switch
              id="file-upload-disabled"
              checked={config.disabled || false}
              onCheckedChange={(checked) => update('disabled', checked)}
            />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onUpdate(config); onClose() }} disabled={!config.label.trim()}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export class FileUploadFieldDefinition extends FormFieldDefinition<FileUploadConfig> {
  readonly identifier = FIELD_IDENTIFIER
  readonly component = FileUploadComponent
  readonly editor = FileUploadEditor

  defaultConfig(): FileUploadConfig {
    return {
      id: `file_${crypto.randomUUID()}`,
      uniqueIdentifier: FIELD_IDENTIFIER,
      label: 'Upload a file',
      description: 'Choose a file to upload.',
      required: false,
      disabled: false,
      maxFiles: 1,
      maxSizeBytes: DEFAULT_MAX_SIZE_BYTES,
    }
  }

  getValidationSchema(field: FileUploadConfig): z.ZodTypeAny {
    const receipt = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().positive().max(maxSizeBytes(field)),
    }).strict()
    const schema = z.array(receipt).max(maxFiles(field))
    return field.required ? schema.min(1, `${field.label} is required`) : schema
  }
}
