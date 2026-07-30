import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()

    // Buscar contagens por status
    const tasks = await prisma.task.findMany({
      select: {
        status: true,
        dueDate: true
      }
    })

    let total = tasks.length
    let pending = 0
    let inProgress = 0
    let awaitingApproval = 0
    let done = 0
    let overdue = 0

    tasks.forEach(task => {
      // Contar por status
      if (task.status === 'BACKLOG' || task.status === 'TODO') {
        pending++
      } else if (task.status === 'IN_PROGRESS') {
        inProgress++
      } else if (task.status === 'AWAITING_APPROVAL') {
        awaitingApproval++
      } else if (task.status === 'DONE') {
        done++
      }

      // Contar atrasadas (não concluídas e data de vencimento menor que agora)
      if (task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < now) {
        overdue++
      }
    })

    // Buscar as 5 próximas entregas ordenadas por data de vencimento
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          not: 'DONE'
        },
        dueDate: {
          not: null
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        awaitingApproval,
        done,
        overdue
      },
      upcomingTasks
    })
  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
