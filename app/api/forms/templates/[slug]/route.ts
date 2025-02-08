import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    const template = await prisma.templates.findUnique({
      where: { slug },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
