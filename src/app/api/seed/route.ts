import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Limpar dados anteriores (deleta em cascata por causa das relações)
    await prisma.activityLog.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.checklistItem.deleteMany()
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()

    // Criar os dois usuários principais
    const designer = await prisma.user.create({
      data: {
        name: 'Lucas Mendes',
        role: 'DESIGNER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
        passwordHash: '1234' // PIN simples de acesso
      }
    })

    const manager = await prisma.user.create({
      data: {
        name: 'Thiago Silva',
        role: 'TRAFFIC_MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thiago',
        passwordHash: '1234'
      }
    })

    // Criar algumas tarefas iniciais para teste no Kanban
    const task1 = await prisma.task.create({
      data: {
        title: 'Criar criativos para campanha de Dia dos Pais',
        description: '<p>Desenvolver 3 variações de criativos estáticos e 1 animação em vídeo para a campanha de Dia dos Pais.</p>',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias no futuro
        assigneeId: designer.id,
        creatorId: manager.id,
        checklist: {
          create: [
            { title: 'Criar conceito visual' },
            { title: 'Desenvolver criativos estáticos (Feed/Stories)' },
            { title: 'Exportar vídeo de 15s' }
          ]
        },
        attachments: {
          create: [
            { name: 'Figma - Referências e Layouts', type: 'LINK', url: 'https://figma.com/file/exemplo' }
          ]
        },
        activityLogs: {
          create: [
            { userId: manager.id, action: 'Criou a tarefa e atribuiu a Lucas Mendes' }
          ]
        }
      }
    })

    const task2 = await prisma.task.create({
      data: {
        title: 'Subir campanha de tráfego pago - Lançamento Produto X',
        description: '<p>Configurar conjuntos de anúncios no Meta Ads e Google Ads com foco em conversão para a landing page.</p>',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 dia no futuro
        assigneeId: manager.id,
        creatorId: designer.id,
        checklist: {
          create: [
            { title: 'Configurar pixel de conversão' },
            { title: 'Criar públicos personalizados' },
            { title: 'Subir anúncios no Meta Ads', isCompleted: true },
            { title: 'Subir anúncios no Google Ads' }
          ]
        },
        attachments: {
          create: [
            { name: 'Meta Ads Manager', type: 'LINK', url: 'https://adsmanager.facebook.com' }
          ]
        },
        activityLogs: {
          create: [
            { userId: designer.id, action: 'Criou a tarefa' },
            { userId: manager.id, action: 'Alterou o status para Em Andamento' }
          ]
        }
      }
    })

    const task3 = await prisma.task.create({
      data: {
        title: 'Identidade visual do novo cliente Y',
        description: '<p>Definição de tipografia, paleta de cores primárias e secundárias, e logotipo principal do cliente Y.</p>',
        priority: 'MEDIUM',
        status: 'AWAITING_APPROVAL',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias no passado (atrasado)
        assigneeId: designer.id,
        creatorId: designer.id,
        checklist: {
          create: [
            { title: 'Pesquisa de referências', isCompleted: true },
            { title: 'Desenho do logo principal', isCompleted: true },
            { title: 'Guia de estilo da marca', isCompleted: true }
          ]
        },
        attachments: {
          create: [
            { name: 'Logo_Final.pdf', type: 'FILE', url: '/uploads/Logo_Final.pdf' }
          ]
        },
        activityLogs: {
          create: [
            { userId: designer.id, action: 'Criou a tarefa e marcou como aguardando aprovação' }
          ]
        },
        comments: {
          create: [
            { userId: designer.id, content: 'Identidade finalizada. Thiago, por favor revise para aprovação final.' }
          ]
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      users: { designer, manager },
      tasks: [task1.id, task2.id, task3.id]
    })
  } catch (error: any) {
    console.error('Error seeding database:', error)
    return NextResponse.json({
      success: false,
      error: error.message || error
    }, { status: 500 })
  }
}
