export const GOOGLE_DRIVE_STORAGE_PROVIDER = 'google-drive'
export const FILE_UPLOAD_MAX_FILES = 10
export const FILE_UPLOAD_MAX_SIZE_BYTES = 4 * 1024 * 1024

type FileUploadLimits = {
  maxFiles?: number
  maxSizeBytes?: number
}

export function normalizeFileUploadMaxFiles({ maxFiles }: FileUploadLimits) {
  return Math.min(Math.max(maxFiles ?? 1, 1), FILE_UPLOAD_MAX_FILES)
}

export function normalizeFileUploadMaxSizeBytes({ maxSizeBytes }: FileUploadLimits) {
  return Math.min(
    Math.max(maxSizeBytes ?? FILE_UPLOAD_MAX_SIZE_BYTES, 1),
    FILE_UPLOAD_MAX_SIZE_BYTES,
  )
}

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
