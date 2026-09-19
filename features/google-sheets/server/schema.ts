import {
  GOOGLE_SHEETS_FIXED_COLUMNS,
  type GoogleSheetsColumn,
} from '@/features/google-sheets/types'
import {
  getOrderedFormFields,
  type FormStructure,
} from '@/features/form-builder/form-structure'

function fieldLabel(label: string | undefined): string {
  return label?.trim() || 'Untitled field'
}

export function createGoogleSheetsHeaders(
  structure: FormStructure,
): GoogleSheetsColumn[] {
  return [
    ...GOOGLE_SHEETS_FIXED_COLUMNS,
    ...getOrderedFormFields(structure).map((field) => ({
      key: field.id,
      label: fieldLabel(field.label),
    })),
  ]
}

export function isGoogleSheetsHeaders(
  value: unknown,
): value is GoogleSheetsColumn[] {
  return (
    Array.isArray(value) &&
    value.length >= GOOGLE_SHEETS_FIXED_COLUMNS.length &&
    value.every(
      (column) =>
        typeof column === 'object' &&
        column !== null &&
        typeof (column as GoogleSheetsColumn).key === 'string' &&
        typeof (column as GoogleSheetsColumn).label === 'string',
    )
  )
}

export function reconcileGoogleSheetsHeaders(
  currentHeaders: GoogleSheetsColumn[],
  structure: FormStructure,
): GoogleSheetsColumn[] {
  const fields = getOrderedFormFields(structure)
  const labelsByFieldId = new Map(
    fields.map((field) => [
      field.id,
      fieldLabel(field.label),
    ]),
  )
  const headers = currentHeaders.map(({ key, label }) => ({
    key,
    // Keep historical columns, but always reflect the exact current label for
    // a field that still exists in the form.
    label: labelsByFieldId.get(key) || label,
  }))
  const knownKeys = new Set(headers.map((header) => header.key))

  for (const field of fields) {
    if (knownKeys.has(field.id)) continue

    headers.push({
      key: field.id,
      label: fieldLabel(field.label),
    })
    knownKeys.add(field.id)
  }

  return headers
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return value.map(formatValue).filter(Boolean).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function createGoogleSheetsRow(
  headers: GoogleSheetsColumn[],
  responseId: string,
  submittedAt: Date,
  data: Record<string, unknown>,
): string[] {
  return headers.map(({ key }) => {
    if (key === '__response_id') return responseId
    if (key === '__submitted_at') return submittedAt.toISOString()
    return formatValue(data[key])
  })
}
