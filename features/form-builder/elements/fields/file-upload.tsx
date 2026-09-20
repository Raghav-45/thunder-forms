'use client'

import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
} from '@/features/form-builder/types'
import {
  FILE_UPLOAD_MAX_FILES,
  FILE_UPLOAD_MAX_SIZE_BYTES,
  FILE_UPLOAD_MIN_FILES,
  FILE_UPLOAD_MIN_SIZE_BYTES,
  normalizeFileUploadMaxFiles,
  normalizeFileUploadMaxSizeBytes,
} from '@/features/file-uploads/constants'
import {
  isFileUploadReceiptList,
  type FileUploadReceipt,
} from '@/features/file-uploads/types'
import { GoogleDriveUploadIntegration } from '@/features/file-uploads/components/google-drive-upload-integration'
import { enableGooglePickerPointerEvents } from '@/features/google-picker/client'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

const FIELD_IDENTIFIER = 'file-upload'

export interface FileUploadConfig extends BaseFieldConfig {
  uniqueIdentifier: typeof FIELD_IDENTIFIER
  acceptedTypes?: string
  maxFiles?: number
  maxSizeBytes?: number
}

function maxFiles(field: FileUploadConfig) {
  return normalizeFileUploadMaxFiles(field)
}

function maxSizeBytes(field: FileUploadConfig) {
  return normalizeFileUploadMaxSizeBytes(field)
}

function formatSize(bytes: number) {
  return `${Math.ceil(bytes / (1024 * 1024))} MB`
}

const FileUploadComponent = ({
  field,
  value,
  onChange,
  onUploadStateChange,
  error,
  formId,
}: FieldProps<FileUploadConfig>) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const files = isFileUploadReceiptList(value) ? value : []
  const limit = maxFiles(field)
  const sizeLimit = maxSizeBytes(field)

  useEffect(
    () => () => onUploadStateChange?.(field.id, false),
    [field.id, onUploadStateChange],
  )

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
    onUploadStateChange?.(field.id, true)
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
        const result = await response.json().catch(() => null) as
          | { error?: unknown; upload?: FileUploadReceipt }
          | null
        if (!response.ok) {
          const message =
            typeof result?.error === 'string'
              ? result.error
              : response.status === 429
                ? 'Upload capacity is busy. Try again in a few seconds.'
                : response.status === 413
                  ? `Files must be no larger than ${formatSize(sizeLimit)}`
                  : 'File upload failed'
          throw new Error(message)
        }
        if (!result?.upload) throw new Error('File upload failed')
        uploaded.push(result.upload)
      }
      onChange([...files, ...uploaded])
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : 'File upload failed',
      )
    } finally {
      setIsUploading(false)
      onUploadStateChange?.(field.id, false)
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
  formId,
  isPersisted,
}: EditorProps<FileUploadConfig> & { isOpen: boolean }) => {
  const [config, setConfig] = useState<FileUploadConfig>(field)
  const [googlePickerOpen, setGooglePickerOpen] = useState(false)
  const [openSections, setOpenSections] = useState(['basic'])

  useEffect(() => {
    if (!googlePickerOpen) return
    return enableGooglePickerPointerEvents()
  }, [googlePickerOpen])

  const update = (key: keyof FileUploadConfig, value: unknown) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const handleSave = () => {
    onUpdate(config)
    onClose()
  }

  const handleCancel = () => {
    setConfig(field)
    onClose()
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setGooglePickerOpen(false)
          onClose()
        }
      }}
    >
      <SheetContent
        className="gap-y-0 overflow-y-auto sm:max-w-md"
        onEscapeKeyDown={googlePickerOpen ? (event) => event.preventDefault() : undefined}
        onFocusOutside={googlePickerOpen ? (event) => event.preventDefault() : undefined}
        onInteractOutside={googlePickerOpen ? (event) => event.preventDefault() : undefined}
      >
        <SheetHeader>
          <SheetTitle className="text-lg">Configure File Upload</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 px-4">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
          >
            <AccordionItem value="basic">
              <AccordionTrigger className="text-base">
                Basic Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-2">
                <div className="space-y-2">
                  <Label htmlFor="file-upload-label">Field Label *</Label>
                  <Input
                    id="file-upload-label"
                    value={config.label}
                    onChange={(event) => update('label', event.target.value)}
                    placeholder="Enter field label"
                    required
                  />
                </div>

                <AccordionWithSwitch
                  text="Description"
                  defaultOpen={!!config.description}
                >
                  <Textarea
                    id="file-upload-description"
                    value={config.description || ''}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="Tell respondents what to upload"
                    rows={3}
                  />
                </AccordionWithSwitch>

                <AccordionWithSwitch
                  text="Accepted File Types"
                  defaultOpen={!!config.acceptedTypes}
                >
                  <Input
                    id="file-upload-types"
                    value={config.acceptedTypes || ''}
                    onChange={(event) => update('acceptedTypes', event.target.value)}
                    placeholder="image/*,.pdf"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Leave empty to allow every file type.
                  </p>
                </AccordionWithSwitch>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="limits">
              <AccordionTrigger className="text-base">
                Upload Limits
              </AccordionTrigger>
              <AccordionContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload-count">Maximum Files</Label>
                  <Input
                    id="file-upload-count"
                    type="number"
                    min={FILE_UPLOAD_MIN_FILES}
                    max={FILE_UPLOAD_MAX_FILES}
                    value={maxFiles(config)}
                    onChange={(event) => update('maxFiles', Number(event.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Per respondent submission.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload-size">Maximum Size (MB)</Label>
                  <Input
                    id="file-upload-size"
                    type="number"
                    min={FILE_UPLOAD_MIN_SIZE_BYTES / (1024 * 1024)}
                    max={FILE_UPLOAD_MAX_SIZE_BYTES / (1024 * 1024)}
                    value={Math.round(maxSizeBytes(config) / (1024 * 1024))}
                    onChange={(event) => update(
                      'maxSizeBytes',
                      normalizeFileUploadMaxSizeBytes({
                        maxSizeBytes: (Number(event.target.value) || 1) * 1024 * 1024,
                      }),
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Up to {formatSize(FILE_UPLOAD_MAX_SIZE_BYTES)} per file is supported.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="destination">
              <AccordionTrigger className="text-base">
                Upload Destination
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {openSections.includes('destination') && formId && isPersisted ? (
                  <GoogleDriveUploadIntegration
                    fieldId={field.id}
                    formId={formId}
                    onPickerOpenChange={setGooglePickerOpen}
                  />
                ) : openSections.includes('destination') ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm leading-5 text-muted-foreground">
                    Save this form after adding this field, then reopen its editor to
                    choose where its files are stored.
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="validation">
              <AccordionTrigger className="text-base">
                Validation Properties
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-upload-required">Required Field</Label>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!config.label.trim()}>
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
      maxSizeBytes: FILE_UPLOAD_MAX_SIZE_BYTES,
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
