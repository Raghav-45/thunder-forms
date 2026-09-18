import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { GoogleSheetsRouteError } from './owner'

const STALE_LOCK_MS = 10 * 60 * 1000

export async function acquireGoogleSheetsSetupLock(
  formId: string,
  userId: string,
) {
  await prisma.google_sheets_setup_locks.deleteMany({
    where: {
      formId,
      createdAt: { lt: new Date(Date.now() - STALE_LOCK_MS) },
    },
  })

  try {
    await prisma.google_sheets_setup_locks.create({ data: { formId, userId } })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new GoogleSheetsRouteError(
        'Google Sheets setup is already in progress',
        409,
      )
    }
    throw error
  }
}

export function releaseGoogleSheetsSetupLock(formId: string, userId: string) {
  return prisma.google_sheets_setup_locks.deleteMany({
    where: { formId, userId },
  })
}
