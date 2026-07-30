import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros
    const search = searchParams.get('search') || ''
    const assigneeId = searchParams.get('assigneeId') || undefined
    const priority = searchParams.get('priority') || undefined
    const status = searchParams.get('status') || undefined
    
    // Obter todas as tarefas aplicando filtros
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          // Filtro por termo de pesquisa
          search ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } }
            ]
          } : {},
          // Filtro por responsável
          assigneeId ? { assigneeId } : {},
          // Filtro por prioridade
          priority ? { priority } : {},
          // Filtro por status
          status ? { status } : {},
        ]
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          }
        },
        checklist: true,
        attachments: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        },
        activityLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('current_user_id')?.value

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, status, dueDate, assigneeId, checklist, attachments } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'O título é obrigatório' }, { status: 400 })
    }

    // Criar a tarefa
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        creatorId: currentUserId,
        // Checklist associado
        checklist: {
          create: checklist?.map((item: any) => ({
            title: item.title,
            isCompleted: !!item.isCompleted
          })) || []
        },
        // Anexos associados
        attachments: {
          create: attachments?.map((item: any) => ({
            name: item.name,
            type: item.type,
            url: item.url
          })) || []
        },
        // Log de atividade inicial
        activityLogs: {
          create: {
            userId: currentUserId,
            action: 'Criou a tarefa'
          }
        }
      },
      include: {
        checklist: true,
        attachments: true
      }
    })

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
