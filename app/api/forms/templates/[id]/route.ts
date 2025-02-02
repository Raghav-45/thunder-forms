import { NextResponse } from 'next/server'
// import { PrismaClient } from '@prisma/client'
// import { FieldType, FormFieldType } from '@/types/types'
import { TemplateType } from '@/types/types'

// const prisma = new PrismaClient()

const dummyTemplate = {
  id: 'dummy-template',
  title: 'Feedback Form',
  description: 'A simple template for gathering feedback from users.',
  fields: [
    {
      variant: 'Input',
      type: 'text',
      label: 'Your Name',
      placeholder: 'Enter your name',
      description: 'Enter your name',
      required: true,
    },
    {
      variant: 'Input',
      type: 'email',
      label: 'Your Email',
      placeholder: 'Enter your email address',
      description: 'Enter your email address',
      required: true,
    },
    {
      variant: 'Textarea',
      type: 'textarea',
      label: 'Feedback',
      placeholder: 'Write your feedback here',
      description: 'Write your feedback here',
      required: false,
    },
  ],
  createdBy: 'admin',
  createdAt: new Date(),
  thumbnailUrl: 'https://via.placeholder.com/150',
} satisfies TemplateType

export async function GET(
  // request: Request,
  // { params }: { params: { id: string } }
) {
  try {
    // const id = params.id

    // const template = await prisma.templates.findUnique({
    //   where: { id },
    // })

    // if (!template) {
    //   return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    // }

    return NextResponse.json(dummyTemplate)
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
