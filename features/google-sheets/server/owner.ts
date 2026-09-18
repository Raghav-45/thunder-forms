import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export class GoogleSheetsRouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export async function getOwnedGoogleSheetsForm(formId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new GoogleSheetsRouteError('Unauthorized', 401)
  }

  const form = await prisma.forms.findUnique({ where: { id: formId } })
  if (!form) throw new GoogleSheetsRouteError('Form not found', 404)
  if (form.userId !== session.user.id) {
    throw new GoogleSheetsRouteError('Unauthorized', 403)
  }

  return { form, userId: session.user.id }
}

export function isGoogleSheetsRouteError(
  error: unknown,
): error is GoogleSheetsRouteError {
  return error instanceof GoogleSheetsRouteError
}

export function googleSheetsErrorResponse(error: unknown) {
  if (isGoogleSheetsRouteError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error('Google Sheets integration error:', error)
  return NextResponse.json(
    {
      error: 'Google Sheets integration failed',
      message:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    },
    { status: 500 },
  )
}
