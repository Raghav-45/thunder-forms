import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const forms = await prisma.templates.findMany({
    orderBy: {
      createdAt: 'desc', // Get newest first
    },
  })
  return NextResponse.json(forms)
}
