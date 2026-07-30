import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const attachments = await prisma.attachment.findMany({
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, attachments })
  } catch (error: any) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
