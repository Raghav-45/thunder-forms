export const GOOGLE_DRIVE_STORAGE_PROVIDER = 'google-drive'

export interface FileUploadReceipt {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
}

export function isFileUploadReceipt(value: unknown): value is FileUploadReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const receipt = value as Record<string, unknown>
  return (
    typeof receipt.id === 'string' &&
    typeof receipt.name === 'string' &&
    typeof receipt.mimeType === 'string' &&
    typeof receipt.sizeBytes === 'number'
  )
}

export function isFileUploadReceiptList(
  value: unknown,
): value is FileUploadReceipt[] {
  return Array.isArray(value) && value.every(isFileUploadReceipt)
}
