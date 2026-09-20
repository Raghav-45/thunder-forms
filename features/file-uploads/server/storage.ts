import {
  deleteGoogleDriveFile,
  downloadGoogleDriveFile,
  uploadGoogleDriveFile,
} from './google-drive'
import { GOOGLE_DRIVE_STORAGE_PROVIDER } from '../constants'

export interface FileStorageProvider {
  upload(input: {
    encryptedRefreshToken: string
    folderId: string
    fileName: string
    mimeType: string
    stream: NodeJS.ReadableStream
  }): Promise<{ storageKey: string }>
  download(input: {
    encryptedRefreshToken: string
    storageKey: string
  }): Promise<NodeJS.ReadableStream>
  delete(input: {
    encryptedRefreshToken: string
    storageKey: string
  }): Promise<void>
}

export const googleDriveStorageProvider: FileStorageProvider = {
  upload: uploadGoogleDriveFile,
  download: ({ encryptedRefreshToken, storageKey }) =>
    downloadGoogleDriveFile(encryptedRefreshToken, storageKey),
  delete: ({ encryptedRefreshToken, storageKey }) =>
    deleteGoogleDriveFile(encryptedRefreshToken, storageKey),
}

export function getFileStorageProvider(provider: string): FileStorageProvider {
  if (provider === GOOGLE_DRIVE_STORAGE_PROVIDER) {
    return googleDriveStorageProvider
  }
  throw new Error(`Unsupported file storage provider: ${provider}`)
}
