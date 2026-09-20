import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export class FileUploadRouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export async function getOwnedFileUploadForm(formId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new FileUploadRouteError('Unauthorized', 401)
  }

  const form = await prisma.forms.findUnique({ where: { id: formId } })
  if (!form) throw new FileUploadRouteError('Form not found', 404)
  if (form.userId !== session.user.id) {
    throw new FileUploadRouteError('Unauthorized', 403)
  }

  return { form, userId: session.user.id }
}

export function fileUploadErrorResponse(error: unknown) {
  if (error instanceof FileUploadRouteError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error('File upload integration error:', error)
  return NextResponse.json(
    {
      error: 'File upload integration failed',
      message:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    },
    { status: 500 },
  )
}
