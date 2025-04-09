import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { responseId: string } }
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
