import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const forms = await prisma.forms.findMany({
    orderBy: {
      createdAt: 'desc', // Get newest first
    },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          responses: true, // Only select the count of responses
        },
      },
      // Don't include `fields` or any other unnecessary relations/fields
    },
  })
  return NextResponse.json(forms)
}
