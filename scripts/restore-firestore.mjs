/**
 * RESTAURAÇÃO DOS DADOS DO FIRESTORE a partir de um backup gerado por `npm run backup`.
 *
 * Uso:
 *   npm run restore -- backups/2026-10-21_1030/firestore
 *   npm run restore -- backups/2026-10-21_1030/firestore --yes   (sem confirmação)
 *
 * Requer scripts/serviceAccount.json (mesma chave do backup — ver scripts/backup.mjs).
 *
 * O que faz: para cada .json da pasta, regrava cada documento no Firestore
 * (merge: true — não apaga campos extras que tenham sido criados depois).
 * Documentos que não existem são criados; os que existem são sobrescritos
 * pelos dados do backup.
 *
 * ATENÇÃO: isso escreve no banco REAL do projeto. Faça backup antes de restaurar.
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SA_PATH = path.join(ROOT, 'scripts', 'serviceAccount.json')

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim().toLowerCase() === 's') }))
}

function loadDocs(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  return files.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }))
}

async function writeDoc(docRef, doc, stats) {
  const { setDoc } = await import('firebase-admin/firestore')
  await setDoc(docRef, doc.data, { merge: true })
  stats.written++
  if (doc.subcollections) {
    for (const sub of doc.subcollections) {
      for (const subDoc of sub.docs) {
        await writeDoc(docRef.collection(sub.id).doc(subDoc.id), subDoc, stats)
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  const yes = args.includes('--yes')
  const backupDir = args.find((a) => !a.startsWith('--'))

  if (!backupDir) {
    console.error('Uso: npm run restore -- backups/<data_hora>/firestore [--yes]')
    process.exit(1)
  }
  const dir = path.isAbsolute(backupDir) ? backupDir : path.join(ROOT, backupDir)
  if (!fs.existsSync(dir)) {
    console.error(`Pasta não encontrada: ${dir}`)
    process.exit(1)
  }
  if (!fs.existsSync(SA_PATH)) {
    console.error('Falta scripts/serviceAccount.json (ver passo a passo no topo de scripts/backup.mjs).')
    process.exit(1)
  }

  const collections = loadDocs(dir)
  const totalDocs = collections.reduce(
    (s, c) => s + c.docs.reduce((n, d) => n + 1 + (d.subcollections ? d.subcollections.reduce((m, sc) => m + sc.docs.length, 0) : 0), 0),
    0
  )

  console.log(`Restauração a partir de: ${path.relative(ROOT, dir)}`)
  for (const c of collections) console.log(`  - ${c.collection}: ${c.docs.length} doc(s)`)
  console.log(`Total: ~${totalDocs} documento(s) serão gravados no projeto ${JSON.parse(fs.readFileSync(SA_PATH, 'utf8')).project_id}.\n`)

  if (!yes) {
    const ok = await confirm('Confirma a restauração no Firestore real? (s/N) ')
    if (!ok) {
      console.log('Cancelado.')
      process.exit(0)
    }
  }

  const { initializeApp, cert, getFirestore } = await import('firebase-admin/app')
  const adminFs = await import('firebase-admin/firestore')
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SA_PATH, 'utf8'))) })
  const db = getFirestore()

  const stats = { written: 0 }
  for (const col of collections) {
    for (const doc of col.docs) {
      await writeDoc(adminFs.collection(db, col.id).doc(doc.id), doc, stats)
    }
    console.log(`  ✓ ${col.collection} restaurada`)
  }

  console.log(`\nConcluído: ${stats.written} documento(s) gravado(s).`)
}

main().catch((err) => {
  console.error('Falha na restauração:', err.message)
  process.exit(1)
})
