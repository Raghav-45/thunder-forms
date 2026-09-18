import { FormValidator } from '@/lib/validators/form'
import { auth } from '@/lib/auth'
import { isFormStructure } from '@/features/form-builder/form-structure'
import { GoogleSheetsIntegrationStatus } from '@prisma/client'
import {
  isGoogleSheetsHeaders,
  reconcileGoogleSheetsHeaders,
} from '@/features/google-sheets/server/schema'
import { updateManagedSheetHeaders } from '@/features/google-sheets/server/sheets'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Parse the request body
    const body = await request.json()
    // Validate the request body
    const {
      title,
      description,
      fields,
      maxSubmissions,
      expiresAt,
      redirectUrl,
      submitButtonText,
    } = FormValidator.parse(body)
    if (!isFormStructure(fields)) {
      return NextResponse.json(
        { success: false, error: 'Invalid form structure' },
        { status: 422 },
      )
    }

    // Check if form exists and user has permission
    const existingForm = await prisma.forms.findUnique({
      where: { id },
      include: {
        googleSheetsIntegration: { include: { connection: true } },
      },
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // // Check if form has expired (optional: prevent updates to expired forms)
    // if (
    //   existingForm.expiresAt &&
    //   new Date(existingForm.expiresAt) < new Date()
    // ) {
    //   return NextResponse.json(
    //     { error: 'Cannot update expired form' },
    //     { status: 410 }
    //   )
    // }

    const formData = {
      title: title,
      description: description,
      fields: fields as unknown as Prisma.InputJsonValue,
      maxSubmissions: maxSubmissions,
      expiresAt: expiresAt,
      redirectUrl: redirectUrl,
      submitButtonText: submitButtonText,
    }
    const integration = existingForm.googleSheetsIntegration
    const nextHeaders =
      integration && isGoogleSheetsHeaders(integration.headers)
        ? reconcileGoogleSheetsHeaders(integration.headers, fields)
        : null
    const headersChanged =
      nextHeaders !== null &&
      JSON.stringify(nextHeaders) !== JSON.stringify(integration?.headers)

    if (integration && !nextHeaders) {
      return NextResponse.json(
        { error: 'Google Sheets integration headers are invalid' },
        { status: 409 },
      )
    }

    if (
      integration &&
      headersChanged &&
      integration.status === GoogleSheetsIntegrationStatus.ACTIVE
    ) {
      await updateManagedSheetHeaders(
        integration.connection.encryptedRefreshToken,
        integration.spreadsheetId,
        integration.sheetId,
        nextHeaders,
      )
    }

    const updatedForm =
      integration && headersChanged
        ? await prisma.$transaction(async (transaction) => {
            const form = await transaction.forms.update({
              where: { id },
              data: formData,
            })
            await transaction.google_sheets_integrations.update({
              where: { id: integration.id },
              data: { headers: nextHeaders as unknown as Prisma.InputJsonValue },
            })
            return form
          })
        : await prisma.forms.update({ where: { id }, data: formData })

    return NextResponse.json(updatedForm)
  } catch (error) {
    console.error('Error updating form:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          issues: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 422 }
      )
    }

    // Unknown errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    )
  } finally {
    // No need to disconnect when using shared Prisma instance
    // The singleton handles connection management
  }
}
