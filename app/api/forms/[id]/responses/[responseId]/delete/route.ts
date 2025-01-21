import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { responseId: string } }
) {
  try {
    const id = params.responseId

    const deletedResponse = await prisma.response.delete({
      where: { id },
    })

    return NextResponse.json(deletedResponse)
  } catch (error) {
    console.error('Delete Response error:', error)
    return NextResponse.json(
      { error: 'Failed to delete Response' },
      { status: 500 }
    )
  }
}
