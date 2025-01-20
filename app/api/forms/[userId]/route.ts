import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request
  // { params }: { params: { userId: string } }
) {
  // const forms = await prisma.forms.findMany({
  //   where: { userId: params.userId },
  // })
  const forms = await prisma.forms.findMany()
  return NextResponse.json(forms)
}
