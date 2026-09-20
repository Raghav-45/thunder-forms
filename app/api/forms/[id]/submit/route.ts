import { FileUploadStatus, GoogleSheetsIntegrationStatus } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import {
  getOrderedFormFields,
  isFormStructure,
} from '@/features/form-builder/form-structure'
import {
  createGoogleSheetsRow,
  isGoogleSheetsHeaders,
} from '@/features/google-sheets/server/schema'
import { drainGoogleSheetsDeliveries } from '@/features/google-sheets/server/deliveries'
import { validateFormFields } from '@/features/form-builder/utils/formValidation'
import {
  isFileUploadReceiptList,
  type FileUploadReceipt,
} from '@/features/file-uploads/types'
import { fileUploadSessionCookieName } from '@/features/file-uploads/server/session'
import { prisma } from '@/lib/prisma'
import { after, NextRequest, NextResponse } from 'next/server'

class SubmissionRouteError extends Error {
  constructor(
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(String(body.error || 'Form submission failed'))
  }
}

function submissionError(status: number, body: Record<string, unknown>): never {
  throw new SubmissionRouteError(status, body)
}

function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2034'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: formId } = await params
    const body = await request.json()
    const { data } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Form data is required and must be an object' },
        { status: 400 },
      )
    }

    let submission: {
      response: { id: string }
      shouldSyncGoogleSheets: boolean
    } | null = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        submission = await prisma.$transaction(
          async (transaction) => {
            const form = await transaction.forms.findUnique({
              where: { id: formId },
              select: {
                id: true,
                fields: true,
                expiresAt: true,
                maxSubmissions: true,
                _count: { select: { responses: true } },
                googleSheetsIntegration: {
                  select: { id: true, headers: true, status: true },
                },
              },
            })

            if (!form) submissionError(404, { error: 'Form not found' })
            if (!isFormStructure(form.fields)) {
              submissionError(422, { error: 'Form structure is invalid' })
            }
            if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
              submissionError(410, { error: 'Form has expired' })
            }
            if (
              form.maxSubmissions &&
              form._count.responses >= form.maxSubmissions
            ) {
              submissionError(410, {
                error: 'Form has reached maximum submissions limit',
              })
            }

            const fields = getOrderedFormFields(form.fields)
            const validationErrors = validateFormFields(fields, data)
            if (Object.keys(validationErrors).length > 0) {
              submissionError(422, {
                error: 'Validation failed',
                validationErrors,
                message: 'Please check your form data and try again',
              })
            }

            const allowedFieldIds = new Set(fields.map((field) => field.id))
            const sanitizedData: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(data)) {
              if (allowedFieldIds.has(key)) sanitizedData[key] = value
            }

            const fileUploadFields = fields.filter(
              (field) => field.uniqueIdentifier === 'file-upload',
            )
            const requestedUploads = fileUploadFields.flatMap((field) => {
              const value = sanitizedData[field.id]
              if (value === undefined || value === null) return []
              if (!isFileUploadReceiptList(value)) {
                submissionError(422, {
                  error: 'Validation failed',
                  validationErrors: { [field.id]: 'Invalid uploaded file' },
                })
              }
              return value.map((receipt) => ({ fieldId: field.id, receipt }))
            })
            const requestedUploadIds = requestedUploads.map(
              ({ receipt }) => receipt.id,
            )
            if (new Set(requestedUploadIds).size !== requestedUploadIds.length) {
              submissionError(422, { error: 'An uploaded file was used more than once' })
            }

            const uploadSessionId = requestedUploadIds.length
              ? request.cookies.get(fileUploadSessionCookieName(formId))?.value
              : undefined
            const uploadSession = uploadSessionId
              ? await transaction.file_upload_sessions.findFirst({
                  where: {
                    id: uploadSessionId,
                    formId,
                    expiresAt: { gt: new Date() },
                  },
                })
              : null
            if (requestedUploadIds.length > 0 && !uploadSession) {
              submissionError(422, { error: 'Uploaded files are no longer available' })
            }

            const uploadedFiles = requestedUploadIds.length
              ? await transaction.file_uploads.findMany({
                  where: {
                    id: { in: requestedUploadIds },
                    formId,
                    sessionId: uploadSession?.id,
                    status: FileUploadStatus.PENDING,
                  },
                })
              : []
            const uploadsById = new Map(uploadedFiles.map((upload) => [upload.id, upload]))
            if (
              uploadedFiles.length !== requestedUploadIds.length ||
              requestedUploads.some(({ fieldId, receipt }) =>
                uploadsById.get(receipt.id)?.fieldId !== fieldId,
              )
            ) {
              submissionError(422, { error: 'An uploaded file is invalid or unavailable' })
            }

            for (const field of fileUploadFields) {
              const value = sanitizedData[field.id]
              if (!isFileUploadReceiptList(value)) continue
              sanitizedData[field.id] = value.map((receipt: FileUploadReceipt) => {
                const upload = uploadsById.get(receipt.id)
                if (!upload) throw new Error('Validated upload is missing')
                return {
                  id: upload.id,
                  name: upload.fileName,
                  mimeType: upload.mimeType,
                  sizeBytes: upload.sizeBytes,
                }
              })
            }

            const createdResponse = await transaction.responses.create({
              data: {
                formsId: formId,
                data: JSON.parse(JSON.stringify(sanitizedData)),
              },
            })

            if (requestedUploadIds.length > 0) {
              const attached = await transaction.file_uploads.updateMany({
                where: {
                  id: { in: requestedUploadIds },
                  formId,
                  sessionId: uploadSession?.id,
                  status: FileUploadStatus.PENDING,
                },
                data: {
                  status: FileUploadStatus.ATTACHED,
                  responseId: createdResponse.id,
                  sessionId: null,
                },
              })
              if (attached.count !== requestedUploadIds.length) {
                throw new Error('An uploaded file was already attached')
              }
            }

            const integration = form.googleSheetsIntegration
            const shouldSyncGoogleSheets =
              integration?.status === GoogleSheetsIntegrationStatus.ACTIVE
            if (shouldSyncGoogleSheets) {
              if (!isGoogleSheetsHeaders(integration.headers)) {
                throw new Error('Google Sheets integration headers are invalid')
              }

              await transaction.google_sheets_deliveries.create({
                data: {
                  integrationId: integration.id,
                  responseId: createdResponse.id,
                  row: createGoogleSheetsRow(
                    integration.headers,
                    createdResponse.id,
                    createdResponse.createdAt,
                    sanitizedData,
                  ),
                },
              })
            }

            return { response: createdResponse, shouldSyncGoogleSheets }
          },
          { isolationLevel: 'Serializable' },
        )
        break
      } catch (error) {
        if (isSerializationFailure(error) && attempt < 2) continue
        throw error
      }
    }

    if (!submission) {
      throw new Error('Form submission transaction did not complete')
    }

    if (submission.shouldSyncGoogleSheets) {
      after(async () => {
        try {
          await drainGoogleSheetsDeliveries(randomUUID())
        } catch (error) {
          console.error('Google Sheets immediate sync failed:', error)
        }
      })
    }

    return NextResponse.json(
      {
        message: 'Form submitted successfully',
        responseId: submission.response.id,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof SubmissionRouteError) {
      return NextResponse.json(error.body, { status: error.status })
    }

    console.error('Form submission error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit form',
        message:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 },
    )
  }
}
