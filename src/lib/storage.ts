// Upload sem Firebase Storage (plano gratuito): arquivos viram data URLs (base64)
// gravados diretamente no Firestore. Imagens são redimensionadas/comprimidas via
// canvas para caber no limite de ~1 MB por documento.

const MAX_IMAGE_SIZE = 720 // largura máxima (px) para imagens
const MAX_DOC_MB = 1 // limite de segurança do Firestore (~1 MB por documento)

// Lê o arquivo como data URL (base64).
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

// Redimensiona e comprime uma imagem, retornando um data URL JPEG menor.
function compressImage(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas indisponível.')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Imagem inválida.'))
    img.src = dataUrl
  })
}

function assertSize(dataUrl: string, label: string): void {
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4)
  if (bytes > MAX_DOC_MB * 1024 * 1024) {
    throw new Error(`${label} é muito grande para o Firestore (máx. ~1 MB).`)
  }
}

// Converte um arquivo em data URL. Imagens são otimizadas; demais tipos viram base64 puro.
export async function fileToDataUrl(file: File, label = 'Arquivo'): Promise<string> {
  const raw = await readAsDataURL(file)
  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(raw, MAX_IMAGE_SIZE)
    assertSize(compressed, label)
    return compressed
  }
  // Para não-imagens (PDF, docs), limita o tamanho do arquivo original a 600 KB
  // pois base64 adiciona ~33% de overhead
  const MAX_NON_IMAGE = 600 * 1024
  if (file.size > MAX_NON_IMAGE) {
    throw new Error(`${label} é muito grande (${Math.round(file.size / 1024)} KB). Limite para arquivos que não são imagens: 600 KB.`)
  }
  assertSize(raw, label)
  return raw
}

// Wrappers com nomes conhecidos pelo restante do app.
export async function uploadFile(file: File): Promise<string> {
  return fileToDataUrl(file, 'Arquivo')
}

export async function uploadAvatar(file: File): Promise<string> {
  return fileToDataUrl(file, 'Foto de perfil')
}

export async function uploadLogo(file: File): Promise<string> {
  return fileToDataUrl(file, 'Logo')
}