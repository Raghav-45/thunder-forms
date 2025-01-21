import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const form = await prisma.forms.findUnique({
      where: { id },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('Get form error:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}
