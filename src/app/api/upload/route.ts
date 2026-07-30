import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Obter buffer do arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Garantir nome único para evitar conflitos
    const originalName = file.name
    const fileExt = path.extname(originalName)
    const fileNameWithoutExt = path.basename(originalName, fileExt)
      .replace(/[^a-zA-Z0-9]/g, '_') // Higieniza nome
    const uniqueFileName = `${fileNameWithoutExt}_${Date.now()}${fileExt}`

    // Caminho da pasta public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    // Garantir que a pasta de uploads exista
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      // Ignora se já existe
    }

    // Salvar o arquivo
    const filePath = path.join(uploadsDir, uniqueFileName)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${uniqueFileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: originalName
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
