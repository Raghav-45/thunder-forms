import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({ params }: { params: { id: string } }) {
  const id = params.id
  // Fetch form logic here - replace with your actual database call
  const form = await prisma.forms.findUnique({
    where: { id },
  })

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  return NextResponse.json(form)
}
