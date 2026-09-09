import { google } from 'googleapis'

// Google Forms API question types
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
        shuffle?: boolean
      }
      textQuestion?: {
        paragraph?: boolean
      }
      scaleQuestion?: {
        low: number
        high: number
        lowLabel?: string
        highLabel?: string
      }
      dateQuestion?: {
        includeTime?: boolean
        includeYear?: boolean
      }
      timeQuestion?: {
        duration?: boolean
      }
      ratingQuestion?: {
        ratingScaleLevel?: number
        iconType?: string
      }
      fileUploadQuestion?: Record<string, unknown>
    }
  }
  questionGroupItem?: {
    questions: { questionId: string; required?: boolean; rowQuestion: { title: string } }[]
    grid: {
      columns: {
        type: 'RADIO' | 'CHECKBOX'
        options: { value: string }[]
      }
    }
  }
  pageBreakItem?: Record<string, unknown>
  textItem?: Record<string, unknown>
  imageItem?: Record<string, unknown>
  videoItem?: Record<string, unknown>
}

interface GoogleForm {
  formId: string
  info: {
    title: string
    documentTitle?: string
    description?: string
  }
  items?: GoogleFormItem[]
}

interface ImportedField {
  id: string
  uniqueIdentifier: string
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  [key: string]: unknown
}

interface ImportResult {
  title: string
  description: string
  fields: ImportedField[]
  skippedItems: string[]
}

/**
 * Check if a URL is a responder/sharing link (not usable with the API).
 */
export function isResponderLink(url: string): boolean {
  return /\/forms\/d\/e\//.test(url)
}

/**
 * Extract Google Form ID from URL.
 * Supports: https://docs.google.com/forms/d/FORM_ID/edit
 *           https://docs.google.com/forms/d/FORM_ID/viewform
 * Does NOT support responder links: /forms/d/e/... (different ID format)
 */
export function extractFormId(url: string): string | null {
  if (isResponderLink(url)) return null
  const match = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !key) {
    throw new Error('Google Service Account credentials not configured')
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/forms.body.readonly'],
  })
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

let fieldCounter = 0

function nextId(prefix: string): string {
  fieldCounter++
  return `${prefix}_${Date.now()}_${fieldCounter}`
}

function mapQuestionItem(item: GoogleFormItem): ImportedField | null {
  const question = item.questionItem?.question
  if (!question) return null

  const base = {
    label: item.title || 'Untitled Question',
    description: item.description || '',
    required: question.required || false,
    disabled: false,
  }

  // Text question
  if (question.textQuestion) {
    if (question.textQuestion.paragraph) {
      return {
        ...base,
        id: nextId('textarea'),
        uniqueIdentifier: 'text-area',
        placeholder: '',
      }
    }
    return {
      ...base,
      id: nextId('text'),
      uniqueIdentifier: 'text-input',
      placeholder: '',
      inputType: 'text',
    }
  }

  // Choice question
  if (question.choiceQuestion) {
    const { type, options } = question.choiceQuestion
    const mappedOptions = options
      .filter((o) => !o.isOther)
      .map((o) => ({
        label: o.value,
        value: slugify(o.value),
      }))

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

  // Scale question → slider
  if (question.scaleQuestion) {
    const { low, high, lowLabel, highLabel } = question.scaleQuestion
    return {
      ...base,
      id: nextId('slider'),
      uniqueIdentifier: 'slider',
      description: [lowLabel, highLabel].filter(Boolean).join(' — ') || base.description,
      min: low || 1,
      max: high || 5,
      step: 1,
      showValue: true,
      defaultValue: low || 1,
    }
  }

  // Date question
  if (question.dateQuestion) {
    if (question.dateQuestion.includeTime) {
      return {
        ...base,
        id: nextId('datetime'),
        uniqueIdentifier: 'datetime-picker',
        placeholder: 'Pick a date & time',
        disablePastDates: false,
        disableFutureDates: false,
      }
    }
    return {
      ...base,
      id: nextId('datepicker'),
      uniqueIdentifier: 'date-picker',
      placeholder: 'Pick a date',
      dateFormat: 'PPP',
      disablePastDates: false,
      disableFutureDates: false,
    }
  }

  // Unsupported types return null
  return null
}

function getSkippedReason(item: GoogleFormItem): string | null {
  const question = item.questionItem?.question
  if (question?.timeQuestion) return `"${item.title || 'Untitled'}" (Time question — not supported)`
  if (question?.fileUploadQuestion) return `"${item.title || 'Untitled'}" (File upload — not supported)`
  if (question?.ratingQuestion) return `"${item.title || 'Untitled'}" (Rating — not supported)`
  if (item.questionGroupItem) return `"${item.title || 'Untitled'}" (Grid/matrix — not supported)`
  if (item.imageItem) return `"${item.title || 'Image'}" (Image — not supported)`
  if (item.videoItem) return `"${item.title || 'Video'}" (Video — not supported)`
  return null
}

/**
 * Fetch a Google Form and convert its items to ThunderForms FieldConfig[].
 */
export async function importGoogleForm(formUrl: string): Promise<ImportResult> {
  const formId = extractFormId(formUrl)
  if (!formId) {
    throw new Error('Invalid Google Forms URL')
  }

  const auth = getAuth()
  const forms = google.forms({ version: 'v1', auth })

  const res = await forms.forms.get({ formId })
  const form = res.data as unknown as GoogleForm

  const fields: ImportedField[] = []
  const skippedItems: string[] = []

  fieldCounter = 0

  for (const item of form.items || []) {
    // Page breaks and text items are not supported.
    if (item.pageBreakItem || item.textItem) {
      skippedItems.push(`"${item.title || 'Untitled'}" (Page break or text item — not supported)`)
      continue
    }

    // Question items
    if (item.questionItem) {
      const mapped = mapQuestionItem(item)
      if (mapped) {
        fields.push(mapped)
      } else {
        const reason = getSkippedReason(item)
        skippedItems.push(reason || `"${item.title || 'Untitled'}" (Unsupported question type)`)
      }
      continue
    }

    // Question group items (grid/matrix)
    if (item.questionGroupItem) {
      skippedItems.push(`"${item.title || 'Untitled'}" (Grid/matrix — not supported)`)
      continue
    }

    // Image and video items
    if (item.imageItem || item.videoItem) {
      const reason = getSkippedReason(item)
      skippedItems.push(reason || `"${item.title || 'Untitled'}" (Media — not supported)`)
      continue
    }

    // Any other unknown item type
    if (!item.pageBreakItem && !item.textItem) {
      skippedItems.push(`"${item.title || 'Untitled'}" (Unknown item type — not supported)`)
    }
  }

  return {
    title: form.info.title || 'Imported Form',
    description: form.info.description || '',
    fields,
    skippedItems,
  }
}
