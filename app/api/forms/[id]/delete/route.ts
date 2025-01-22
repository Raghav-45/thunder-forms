import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const deletedForm = await prisma.forms.delete({
      where: { id },
    })

    return NextResponse.json(deletedForm)
  } catch (error) {
    console.error('Delete form error:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
