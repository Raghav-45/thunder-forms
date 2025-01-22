import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const forms = await prisma.forms.findMany()
  return NextResponse.json(forms)
}
