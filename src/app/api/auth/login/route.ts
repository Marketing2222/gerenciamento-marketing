import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json()

    if (!userId || !pin) {
      return NextResponse.json({ success: false, error: 'Usuário e PIN são obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Validação simples de PIN
    if (user.passwordHash && user.passwordHash !== pin) {
      return NextResponse.json({ success: false, error: 'PIN incorreto' }, { status: 401 })
    }

    // Set cookie de autenticação via API do Next.js 16
    const cookieStore = await cookies()
    cookieStore.set('current_user_id', user.id, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax'
    })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role, avatarUrl: user.avatarUrl } })
  } catch (error: any) {
    console.error('Error logging in:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
