import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id

    // Fetch form with its responses
    const formWithResponses = await prisma.forms.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: {
            createdAt: 'desc', // Get newest responses first
          },
        },
      },
    })

    if (!formWithResponses) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (formWithResponses.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      formId: formWithResponses.id,
      title: formWithResponses.title,
      responses: formWithResponses.responses,
    })
  } catch (error) {
    console.error('Get form responses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form responses' },
      { status: 500 }
    )
  }
}

// Optional: Add pagination support
// export async function GET_WITH_PAGINATION(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const id = params.id
//     const { searchParams } = new URL(request.url)

//     // Pagination parameters
//     const page = parseInt(searchParams.get('page') ?? '1')
//     const limit = parseInt(searchParams.get('limit') ?? '10')
//     const skip = (page - 1) * limit

//     // Get total count of responses
//     const totalResponses = await prisma.response.count({
//       where: { formsId: id },
//     })

//     // Fetch paginated responses
//     const formWithResponses = await prisma.forms.findUnique({
//       where: { id },
//       include: {
//         responses: {
//           orderBy: {
//             createdAt: 'desc',
//           },
//           skip,
//           take: limit,
//         },
//       },
//     })

//     if (!formWithResponses) {
//       return NextResponse.json({ error: 'Form not found' }, { status: 404 })
//     }

//     return NextResponse.json({
//       formId: formWithResponses.id,
//       title: formWithResponses.title,
//       responses: formWithResponses.responses,
//       pagination: {
//         total: totalResponses,
//         pages: Math.ceil(totalResponses / limit),
//         currentPage: page,
//         pageSize: limit,
//       },
//     })
//   } catch (error) {
//     console.error('Get form responses error:', error)
//     return NextResponse.json(
//       { error: 'Failed to fetch form responses' },
//       { status: 500 }
//     )
//   }
// }
