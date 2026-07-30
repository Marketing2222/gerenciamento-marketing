import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Tradutor de status para o log de atividades
const statusLabels: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  AWAITING_APPROVAL: 'Aguardando Aprovação',
  DONE: 'Concluído'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('current_user_id')?.value

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...payload } = body

    // Obter tarefa original para comparação e logs
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { checklist: true, assignee: true }
    })

    if (!originalTask) {
      return NextResponse.json({ success: false, error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // AÇÕES SUB-RECURSO
    if (action === 'ADD_COMMENT') {
      const { content } = payload
      if (!content) return NextResponse.json({ success: false, error: 'Conteúdo do comentário é obrigatório' }, { status: 400 })
      
      const comment = await prisma.comment.create({
        data: {
          content,
          taskId,
          userId: currentUserId
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, role: true }
          }
        }
      })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: 'Adicionou um comentário'
        }
      })

      return NextResponse.json({ success: true, comment })
    }

    if (action === 'ADD_ATTACHMENT') {
      const { name, type, url } = payload
      if (!name || !url) return NextResponse.json({ success: false, error: 'Nome e URL do anexo são obrigatórios' }, { status: 400 })

      const attachment = await prisma.attachment.create({
        data: { name, type: type || 'LINK', url, taskId }
      })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Adicionou o anexo: ${name}`
        }
      })

      return NextResponse.json({ success: true, attachment })
    }

    if (action === 'DELETE_ATTACHMENT') {
      const { attachmentId } = payload
      const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
      if (!attachment) return NextResponse.json({ success: false, error: 'Anexo não encontrado' }, { status: 404 })

      await prisma.attachment.delete({ where: { id: attachmentId } })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Removeu o anexo: ${attachment.name}`
        }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'TOGGLE_CHECKLIST') {
      const { itemId, isCompleted } = payload
      const item = await prisma.checklistItem.findUnique({ where: { id: itemId } })
      if (!item) return NextResponse.json({ success: false, error: 'Item do checklist não encontrado' }, { status: 404 })

      const updatedItem = await prisma.checklistItem.update({
        where: { id: itemId },
        data: { isCompleted }
      })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `${isCompleted ? 'Concluiu' : 'Desmarcou'} o item: "${item.title}"`
        }
      })

      return NextResponse.json({ success: true, item: updatedItem })
    }

    if (action === 'ADD_CHECKLIST') {
      const { title } = payload
      if (!title) return NextResponse.json({ success: false, error: 'Título do item é obrigatório' }, { status: 400 })

      const item = await prisma.checklistItem.create({
        data: { title, taskId }
      })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Adicionou item ao checklist: "${title}"`
        }
      })

      return NextResponse.json({ success: true, item })
    }

    if (action === 'DELETE_CHECKLIST') {
      const { itemId } = payload
      const item = await prisma.checklistItem.findUnique({ where: { id: itemId } })
      if (!item) return NextResponse.json({ success: false, error: 'Item do checklist não encontrado' }, { status: 404 })

      await prisma.checklistItem.delete({ where: { id: itemId } })

      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: `Removeu item do checklist: "${item.title}"`
        }
      })

      return NextResponse.json({ success: true })
    }

    // ATUALIZAÇÃO GERAL DA TAREFA
    const { title, description, priority, status, dueDate, assigneeId } = payload
    
    // Preparar logs de modificações
    const logsToCreate: string[] = []

    if (status && status !== originalTask.status) {
      logsToCreate.push(`Moveu para "${statusLabels[status] || status}"`)
    }
    if (assigneeId !== undefined && assigneeId !== originalTask.assigneeId) {
      if (assigneeId === null) {
        logsToCreate.push('Removeu o responsável')
      } else {
        const newAssignee = await prisma.user.findUnique({ where: { id: assigneeId } })
        logsToCreate.push(`Atribuiu a tarefa a ${newAssignee?.name || 'outro usuário'}`)
      }
    }
    if (priority && priority !== originalTask.priority) {
      logsToCreate.push(`Alterou a prioridade para ${priority}`)
    }
    if (title && title !== originalTask.title) {
      logsToCreate.push(`Alterou o título para "${title}"`)
    }

    // Se editou mais coisas e não gerou logs específicos
    if (logsToCreate.length === 0 && (description !== undefined || dueDate !== undefined)) {
      logsToCreate.push('Editou os detalhes da tarefa')
    }

    // Atualizar no banco
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        status: status !== undefined ? status : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined
      }
    })

    // Gravar logs de atividade
    for (const logText of logsToCreate) {
      await prisma.activityLog.create({
        data: {
          taskId,
          userId: currentUserId,
          action: logText
        }
      })
    }

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('current_user_id')?.value

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true, message: 'Tarefa excluída com sucesso' })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
