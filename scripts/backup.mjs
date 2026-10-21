/**
 * BACKUP COMPLETO DO SITE (gratuito, local, sem billing/gcloud)
 *
 * Uso:
 *   npm run backup
 *
 * Gera em backups/<data_hora>/:
 *   - site.zip          → código versionado (git archive do HEAD)
 *   - env/              → cópias dos arquivos .env locais
 *   - firestore/        → TODOS os dados do Firestore em JSON (users, tasks,
 *                          settings, gamification_*, com subcoleções)
 *
 * IMPORTANTE — primeira vez só:
 *   1. Abra https://console.firebase.google.com → seu projeto
 *   2. Configurações do projeto (engrenagem) → aba "Contas de serviço"
 *   3. Clique em "Gerar nova chave privada" (baixa um .json)
 *   4. Salve o arquivo como: scripts/serviceAccount.json  (NÃO commite; já está no .gitignore)
 *
 * A pasta backups/ fica dentro do OneDrive → o backup é sincronizado
 * automaticamente pra nuvem (off-site) sem custo nenhum.
 *
 * Restaurar os dados: npm run restore -- backups/<data_hora>/firestore
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SA_PATH = path.join(ROOT, 'scripts', 'serviceAccount.json')
const MAX_DEPTH = 6

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

function gitDirty() {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    return out.trim().length > 0
  } catch {
    return false
  }
}

function backupCode(destDir) {
  const zipPath = path.join(destDir, 'site.zip')
  execFileSync('git', ['archive', '--format=zip', `--output=${zipPath}`, 'HEAD'], { cwd: ROOT })
  if (gitDirty()) {
    console.log('  ! Atenção: há alterações NÃO commitadas no código. O site.zip usa o último commit.')
  }
  return zipPath
}

function backupEnv(destDir) {
  const envDir = path.join(destDir, 'env')
  fs.mkdirSync(envDir, { recursive: true })
  const copied = []
  for (const name of fs.readdirSync(ROOT)) {
    if (/^\.env($|\.)/.test(name) && fs.statSync(path.join(ROOT, name)).isFile()) {
      fs.copyFileSync(path.join(ROOT, name), path.join(envDir, name))
      copied.push(name)
    }
  }
  return copied
}

async function exportCollectionRef(colRef, depth = 0) {
  if (depth > MAX_DEPTH) return []
  const snap = await colRef.get()
  const docs = []
  for (const docSnap of snap.docs) {
    const doc = { id: docSnap.id, data: docSnap.data() }
    const subs = await docSnap.ref.listCollections()
    if (subs.length > 0) {
      doc.subcollections = []
      for (const sub of subs) {
        doc.subcollections.push({
          id: sub.id,
          docs: await exportCollectionRef(sub, depth + 1),
        })
      }
    }
    docs.push(doc)
  }
  return docs
}

async function backupFirestore(destDir) {
  const { initializeApp, cert } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')

  const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'))
  initializeApp({ credential: cert(sa) })
  const db = getFirestore()

  const fsDir = path.join(destDir, 'firestore')
  fs.mkdirSync(fsDir, { recursive: true })

  const rootCols = await db.listCollections()
  const manifest = { exportedAt: new Date().toISOString(), project: sa.project_id, collections: [] }

  for (const col of rootCols) {
    const docs = await exportCollectionRef(col)
    fs.writeFileSync(
      path.join(fsDir, `${col.id}.json`),
      JSON.stringify({ collection: col.id, docs }, null, 2)
    )
    const countSub = (list) =>
      list.reduce((sum, d) => sum + 1 + (d.subcollections ? countSub(d.subcollections) : 0), 0)
    manifest.collections.push({ id: col.id, documents: countSub(docs) })
    console.log(`  ✓ ${col.id}: ${docs.length} doc(s)`)
  }

  fs.writeFileSync(path.join(fsDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return manifest
}

async function main() {
  const stampStr = stamp()
  const destDir = path.join(ROOT, 'backups', stampStr)
  fs.mkdirSync(destDir, { recursive: true })

  console.log(`Backup em andamento → ${path.relative(ROOT, destDir)}\n`)

  console.log('[1/3] Código (git)...')
  backupCode(destDir)
  console.log('  ✓ site.zip\n')

  console.log('[2/3] Variáveis de ambiente (.env)...')
  const envs = backupEnv(destDir)
  console.log(`  ✓ ${envs.length} arquivo(s): ${envs.join(', ') || 'nenhum'}\n`)

  console.log('[3/3] Dados do Firestore...')
  if (fs.existsSync(SA_PATH)) {
    const manifest = await backupFirestore(destDir)
    const total = manifest.collections.reduce((s, c) => s + c.documents, 0)
    console.log(`  ✓ ${manifest.collections.length} coleção(ões), ${total} documento(s) no total\n`)
  } else {
    console.log('  ✗ Pulado: scripts/serviceAccount.json não encontrado.')
    console.log('    Crie a chave (gratuita) seguindo o passo a passo no topo deste arquivo.')
    console.log('    Sem ela, o backup terá apenas código + .env (sem os dados do Firestore).\n')
  }

  console.log('Concluído. Pasta backups/ é sincronizada pelo OneDrive (backup automático na nuvem).')
  console.log('Para restaurar os dados: npm run restore -- backups/' + stampStr + '/firestore')
}

main().catch((err) => {
  console.error('Falha no backup:', err.message)
  process.exit(1)
})
