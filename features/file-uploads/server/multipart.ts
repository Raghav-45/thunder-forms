import Busboy from 'busboy'
import { Readable, Transform } from 'node:stream'

const FIELD_NAME = 'fieldId'
const FILE_NAME = 'file'
const MAX_FIELD_SIZE_BYTES = 256
const MAX_HEADER_PAIRS = 32

export class FileUploadRequestError extends Error {
  constructor(message: string, readonly status: 400 | 413 = 400) {
    super(message)
  }
}

export class FileUploadSizeLimitError extends Error {
  constructor() {
    super('File exceeds its configured size limit')
  }
}

export class FileUploadContentError extends Error {
  constructor() {
    super('Executable file content is not allowed')
  }
}

export type StreamedFileUpload = {
  fieldId: string
  fileName: string
  mimeType: string
  stream: Readable
  completed: Promise<void>
  isTruncated: () => boolean
  abort: () => void
}

export function createSizeLimitedFileStream(
  source: Readable,
  maximumFileSizeBytes: number,
) {
  let sizeBytes = 0
  let exceededLimit = false
  let signature = Buffer.alloc(0)
  const stream = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (signature.length < 4) {
        signature = Buffer.concat([signature, chunk.subarray(0, 4 - signature.length)])
        const isWindowsExecutable = signature.length >= 2 && signature[0] === 0x4d && signature[1] === 0x5a
        const isElfExecutable = signature.length >= 4 && signature.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
        const isMachOExecutable = signature.length >= 4 && [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe].includes(signature.readUInt32BE(0))
        if (isWindowsExecutable || isElfExecutable || isMachOExecutable) {
          callback(new FileUploadContentError())
          return
        }
      }
      sizeBytes += chunk.length
      if (sizeBytes > maximumFileSizeBytes) {
        exceededLimit = true
        callback(new FileUploadSizeLimitError())
        return
      }
      callback(null, chunk)
    },
  })

  stream.on('error', () => {
    source.unpipe(stream)
    source.resume()
  })
  source.pipe(stream)

  return {
    stream,
    getSizeBytes: () => sizeBytes,
    exceededLimit: () => exceededLimit,
  }
}

export function parseStreamedFileUpload(
  request: Request,
  maximumFileSizeBytes: number,
): Promise<StreamedFileUpload> {
  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
    return Promise.reject(new FileUploadRequestError('A field and file are required'))
  }
  if (!request.body) {
    return Promise.reject(new FileUploadRequestError('A field and file are required'))
  }

  return new Promise((resolve, reject) => {
    const source = Readable.fromWeb(
      request.body as unknown as import('node:stream/web').ReadableStream,
    )
    const parser = Busboy({
      headers: { 'content-type': contentType },
      limits: {
        fieldNameSize: FIELD_NAME.length,
        fieldSize: MAX_FIELD_SIZE_BYTES,
        fields: 1,
        files: 1,
        // Busboy emits `partsLimit` when it reaches the configured count, so
        // allow the expected two parts and fail if a third is encountered.
        parts: 3,
        headerPairs: MAX_HEADER_PAIRS,
        // The field-specific limit is applied by the upload route after it has
        // loaded the form. This remains a hard parser-level ceiling for all files.
        fileSize: maximumFileSizeBytes + 1,
      },
    })

    let fieldId: string | null = null
    let fileSeen = false
    let fileTruncated = false
    let settled = false
    let resolveCompleted!: () => void
    let rejectCompleted!: (error: Error) => void
    const completed = new Promise<void>((resolveCompletion, rejectCompletion) => {
      resolveCompleted = resolveCompletion
      rejectCompleted = rejectCompletion
    })

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      source.destroy()
      parser.destroy()
      reject(error)
      rejectCompleted(error)
    }

    parser.on('field', (name, value, info) => {
      if (
        name !== FIELD_NAME ||
        info.nameTruncated ||
        info.valueTruncated ||
        fieldId !== null ||
        !value
      ) {
        fail(new FileUploadRequestError('A field and file are required'))
        return
      }
      fieldId = value
    })

    parser.on('file', (name, stream, info) => {
      if (name !== FILE_NAME || !fieldId || fileSeen || !info.filename) {
        stream.resume()
        fail(new FileUploadRequestError('A field and file are required'))
        return
      }

      fileSeen = true
      stream.on('limit', () => {
        fileTruncated = true
      })
      stream.on('error', (error) => {
        fail(error instanceof Error ? error : new Error('Failed to read file upload'))
      })

      resolve({
        fieldId,
        fileName: info.filename,
        mimeType: info.mimeType || 'application/octet-stream',
        stream,
        completed,
        isTruncated: () => fileTruncated || !!stream.truncated,
        abort: () => fail(new Error('File upload was cancelled')),
      })
    })

    parser.on('filesLimit', () => {
      fail(new FileUploadRequestError('Only one file can be uploaded at a time'))
    })
    parser.on('fieldsLimit', () => {
      fail(new FileUploadRequestError('A field and file are required'))
    })
    parser.on('partsLimit', () => {
      fail(new FileUploadRequestError('Only one file can be uploaded at a time'))
    })
    parser.on('error', (error) => {
      fail(error instanceof Error ? error : new Error('Failed to parse file upload'))
    })
    parser.on('close', () => {
      if (settled) return
      if (!fieldId || !fileSeen) {
        fail(new FileUploadRequestError('A field and file are required'))
        return
      }
      settled = true
      resolveCompleted()
    })
    source.on('error', (error) => {
      fail(error instanceof Error ? error : new Error('Failed to read file upload'))
    })

    source.pipe(parser)
  })
}
