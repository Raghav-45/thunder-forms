import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id

  const deletedForm = await prisma.forms.delete({
    where: { id },
  })

  return NextResponse.json(deletedForm)
}
