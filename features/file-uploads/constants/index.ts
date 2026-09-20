export const GOOGLE_DRIVE_STORAGE_PROVIDER = 'google-drive'
export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const FILE_UPLOAD_MIN_FILES = 1
export const FILE_UPLOAD_MAX_FILES = 10
export const FILE_UPLOAD_MIN_SIZE_BYTES = 1
export const FILE_UPLOAD_MAX_SIZE_BYTES = 4 * 1024 * 1024

type FileUploadLimits = {
  maxFiles?: number
  maxSizeBytes?: number
}

export function normalizeFileUploadMaxFiles({ maxFiles }: FileUploadLimits) {
  return Math.min(
    Math.max(maxFiles ?? FILE_UPLOAD_MIN_FILES, FILE_UPLOAD_MIN_FILES),
    FILE_UPLOAD_MAX_FILES,
  )
}

export function normalizeFileUploadMaxSizeBytes({ maxSizeBytes }: FileUploadLimits) {
  return Math.min(
    Math.max(maxSizeBytes ?? FILE_UPLOAD_MAX_SIZE_BYTES, FILE_UPLOAD_MIN_SIZE_BYTES),
    FILE_UPLOAD_MAX_SIZE_BYTES,
  )
}
