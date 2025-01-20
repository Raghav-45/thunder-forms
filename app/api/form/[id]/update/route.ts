import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const body = await request.json()

  const updatedForm = await prisma.forms.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(updatedForm)
}
