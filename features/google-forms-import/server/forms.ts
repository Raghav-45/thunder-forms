import { google } from 'googleapis'
import {
  normalizeFileUploadMaxFiles,
  normalizeFileUploadMaxSizeBytes,
} from '@/features/file-uploads/constants'
import { createChoiceOptionId } from '@/features/form-builder/elements/choice-options'
import type { ImportedGoogleFormPage } from '@/features/google-forms-import/types'

interface GoogleFormItem {
  itemId: string
  title?: string
  description?: string
  questionItem?: {
    question: {
      questionId: string
      required?: boolean
      choiceQuestion?: {
        type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN'
        options: { value: string; isOther?: boolean }[]
      }
      textQuestion?: { paragraph?: boolean }
      scaleQuestion?: {
        low: number
        high: number
        lowLabel?: string
        highLabel?: string
      }
      dateQuestion?: { includeTime?: boolean; includeYear?: boolean }
      timeQuestion?: { duration?: boolean }
      ratingQuestion?: { ratingScaleLevel?: number; iconType?: string }
      fileUploadQuestion?: {
        maxFiles?: number
        maxFileSize?: string
        types?: string[]
      }
    }
  }
  questionGroupItem?: {
    questions: { questionId: string; required?: boolean; rowQuestion: { title: string } }[]
    grid: { columns: { type: 'RADIO' | 'CHECKBOX'; options: { value: string }[] } }
  }
  pageBreakItem?: Record<string, unknown>
  textItem?: Record<string, unknown>
  imageItem?: Record<string, unknown>
  videoItem?: Record<string, unknown>
}

interface GoogleForm {
  formId: string
  info: { title: string; documentTitle?: string; description?: string }
  items?: GoogleFormItem[]
}

interface ImportedGoogleFormField {
  id: string
  uniqueIdentifier: string
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  [key: string]: unknown
}

export interface GoogleFormsImportResult {
  title: string
  description: string
  pages: ImportedGoogleFormPage[]
  skippedItems: string[]
}

export interface GoogleFormsImportListItem {
  id: string
  title: string
  modifiedTime: string | null
  ownedByMe: boolean
}

export interface GoogleFormsImportList {
  forms: GoogleFormsImportListItem[]
  nextPageToken: string | null
}

function createAccessTokenClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return auth
}

export async function listGoogleForms(
  accessToken: string,
  pageToken?: string,
): Promise<GoogleFormsImportList> {
  const drive = google.drive({
    version: 'v3',
    auth: createAccessTokenClient(accessToken),
  })
  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.form' and trashed = false",
    pageSize: 50,
    pageToken,
    orderBy: 'modifiedTime desc',
    fields: 'nextPageToken,files(id,name,modifiedTime,ownedByMe)',
    spaces: 'drive',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  })

  return {
    forms: (response.data.files || []).flatMap((file) =>
      file.id && file.name
        ? [{
            id: file.id,
            title: file.name,
            modifiedTime: file.modifiedTime || null,
            ownedByMe: file.ownedByMe === true,
          }]
        : [],
    ),
    nextPageToken: response.data.nextPageToken || null,
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function mapChoiceOptions(
  options: { value: string; isOther?: boolean }[],
) {
  const usedValues = new Set<string>()

  return options
    .filter((option) => !option.isOther)
    .map((option, index) => {
      const label = option.value || `Option ${index + 1}`
      const baseValue = slugify(label) || `option_${index + 1}`
      let value = baseValue
      let suffix = 2
      while (usedValues.has(value)) {
        value = `${baseValue}_${suffix}`
        suffix += 1
      }
      usedValues.add(value)
      return { id: createChoiceOptionId(), label, value }
    })
}

function nextId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

const GOOGLE_FILE_TYPE_ACCEPTS: Record<string, string> = {
  AUDIO: 'audio/*',
  DOCUMENT: '.doc,.docx,.odt,.rtf,.txt',
  IMAGE: 'image/*',
  PDF: '.pdf',
  PRESENTATION: '.odp,.ppt,.pptx',
  SPREADSHEET: '.csv,.ods,.xls,.xlsx',
  VIDEO: 'video/*',
}

function acceptedFileTypes(types: string[] | undefined): string | undefined {
  if (!types?.length || types.includes('ANY')) return undefined

  const accepts = types.flatMap((type) => GOOGLE_FILE_TYPE_ACCEPTS[type]?.split(',') ?? [])
  return accepts.length ? [...new Set(accepts)].join(',') : undefined
}

function uploadMaxFiles(maxFiles: number | undefined): number | undefined {
  return typeof maxFiles === 'number' && Number.isInteger(maxFiles) && maxFiles > 0
    ? normalizeFileUploadMaxFiles({ maxFiles })
    : undefined
}

function uploadMaxSizeBytes(maxFileSize: string | undefined): number | undefined {
  if (!maxFileSize || !/^\d+$/.test(maxFileSize)) return undefined

  const parsed = Number(maxFileSize)
  return Number.isSafeInteger(parsed) && parsed > 0
    ? normalizeFileUploadMaxSizeBytes({ maxSizeBytes: parsed })
    : undefined
}

function ratingStyle(iconType: string | undefined) {
  if (iconType === 'HEART') return 'heart'
  if (iconType === 'THUMB_UP') return 'thumb'
  return 'star'
}

function ratingMaxScore(value: number | undefined) {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(Math.max(value, 2), 10)
    : 5
}

function mapQuestionItem(item: GoogleFormItem): ImportedGoogleFormField | null {
  const question = item.questionItem?.question
  if (!question) return null

  const base = {
    label: item.title || 'Untitled Question',
    description: item.description || '',
    required: question.required || false,
    disabled: false,
  }

  if (question.textQuestion) {
    return question.textQuestion.paragraph
      ? { ...base, id: nextId('textarea'), uniqueIdentifier: 'text-area', placeholder: '' }
      : {
          ...base,
          id: nextId('text'),
          uniqueIdentifier: 'text-input',
          placeholder: '',
          inputType: 'text',
        }
  }

  if (question.choiceQuestion) {
    const { type, options } = question.choiceQuestion
    const mappedOptions = mapChoiceOptions(options || [])

    if (type === 'RADIO') {
      return {
        ...base,
        id: nextId('radio'),
        uniqueIdentifier: 'radio-group',
        orientation: 'vertical',
        options: mappedOptions,
      }
    }
    if (type === 'CHECKBOX') {
      return {
        ...base,
        id: nextId('multiselect'),
        uniqueIdentifier: 'multi-select',
        placeholder: 'Select options',
        options: mappedOptions,
        searchable: false,
        allowCustomValues: false,
      }
    }
    if (type === 'DROP_DOWN') {
      return {
        ...base,
        id: nextId('select'),
        uniqueIdentifier: 'single-select',
        placeholder: 'Choose one...',
        options: mappedOptions,
      }
    }
  }

  if (question.scaleQuestion) {
    const { low, high, lowLabel, highLabel } = question.scaleQuestion
    return {
      ...base,
      id: nextId('slider'),
      uniqueIdentifier: 'slider',
      description: [lowLabel, highLabel].filter(Boolean).join(' — ') || base.description,
      min: low ?? 1,
      max: high ?? 5,
      step: 1,
      showValue: true,
      defaultValue: low ?? 1,
    }
  }

  if (question.dateQuestion) {
    return question.dateQuestion.includeTime
      ? {
          ...base,
          id: nextId('datetime'),
          uniqueIdentifier: 'datetime-picker',
          placeholder: 'Pick a date & time',
          disablePastDates: false,
          disableFutureDates: false,
        }
      : {
          ...base,
          id: nextId('datepicker'),
          uniqueIdentifier: 'date-picker',
          placeholder: 'Pick a date',
          dateFormat: 'PPP',
          disablePastDates: false,
          disableFutureDates: false,
        }
  }

  if (question.timeQuestion) {
    return {
      ...base,
      id: nextId('time'),
      uniqueIdentifier: 'time-picker',
      mode: question.timeQuestion.duration ? 'duration' : 'time',
      minuteStep: 1,
    }
  }

  if (question.fileUploadQuestion) {
    const upload = question.fileUploadQuestion
    const acceptedTypes = acceptedFileTypes(upload.types)
    const maxFiles = uploadMaxFiles(upload.maxFiles)
    const maxSizeBytes = uploadMaxSizeBytes(upload.maxFileSize)

    return {
      ...base,
      id: nextId('file'),
      uniqueIdentifier: 'file-upload',
      ...(acceptedTypes ? { acceptedTypes } : {}),
      ...(maxFiles ? { maxFiles } : {}),
      ...(maxSizeBytes ? { maxSizeBytes } : {}),
    }
  }

  if (question.ratingQuestion) {
    return {
      ...base,
      id: nextId('rating'),
      uniqueIdentifier: 'rating',
      style: ratingStyle(question.ratingQuestion.iconType),
      maxRating: ratingMaxScore(question.ratingQuestion.ratingScaleLevel),
      step: 1,
      showValue: false,
    }
  }

  return null
}

function getSkippedReason(item: GoogleFormItem): string | null {
  if (item.questionGroupItem) return `\"${item.title || 'Untitled'}\" (Grid/matrix — not supported)`
  if (item.imageItem) return `\"${item.title || 'Image'}\" (Image — not supported)`
  if (item.videoItem) return `\"${item.title || 'Video'}\" (Video — not supported)`
  return null
}

export function convertGoogleForm(form: GoogleForm): GoogleFormsImportResult {
  const pages: ImportedGoogleFormPage[] = [{ fields: [] }]
  const skippedItems: string[] = []
  let currentPage = pages[0]

  for (const item of form.items || []) {
    if (item.pageBreakItem) {
      currentPage = {
        ...(item.title ? { title: item.title } : {}),
        ...(item.description ? { description: item.description } : {}),
        fields: [],
      }
      pages.push(currentPage)
      continue
    }
    if (item.textItem) {
      skippedItems.push(`\"${item.title || 'Untitled'}\" (Text item — not supported)`)
      continue
    }
    if (item.questionItem) {
      const mapped = mapQuestionItem(item)
      if (mapped) currentPage.fields.push(mapped)
      else {
        const reason = getSkippedReason(item)
        skippedItems.push(reason || `\"${item.title || 'Untitled'}\" (Unsupported question type)`)
      }
      continue
    }
    if (item.questionGroupItem || item.imageItem || item.videoItem) {
      const reason = getSkippedReason(item)
      skippedItems.push(reason || `\"${item.title || 'Untitled'}\" (Unsupported item type)`)
    }
  }

  return {
    title: form.info.title || 'Imported Form',
    description: form.info.description || '',
    pages,
    skippedItems,
  }
}

export async function importGoogleForm(
  accessToken: string,
  formId: string,
): Promise<GoogleFormsImportResult> {
  const forms = google.forms({
    version: 'v1',
    auth: createAccessTokenClient(accessToken),
  })
  const response = await forms.forms.get({ formId })
  return convertGoogleForm(response.data as unknown as GoogleForm)
}
