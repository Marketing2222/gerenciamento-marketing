import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('current_user_id')?.value

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas o próprio usuário pode alterar seu perfil (para segurança básica)
    if (currentUserId !== userId) {
      return NextResponse.json({ success: false, error: 'Ação não permitida' }, { status: 403 })
    }

    const body = await request.json()
    const { name, role, avatarUrl, pin } = body

    // Atualizar no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        role: role !== undefined ? role : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        passwordHash: pin !== undefined ? pin : undefined
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl
      }
    })
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
