import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('current_user_id')

    if (!userIdCookie || !userIdCookie.value) {
      return NextResponse.json({ success: false, user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdCookie.value },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true
      }
    })

    if (!user) {
      // Cookie inválido ou usuário deletado, limpa cookie
      const response = NextResponse.json({ success: false, user: null })
      response.cookies.set('current_user_id', '', { path: '/', maxAge: 0 })
      return response
    }

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
