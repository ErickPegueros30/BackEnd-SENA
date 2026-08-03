#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendMail } from '../src/config/mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()
const dir = path.join(root, 'failed-emails')

async function listFiles() {
  if (!fs.existsSync(dir)) {
    console.log('No existe carpeta failed-emails/')
    return []
  }
  const files = await fs.promises.readdir(dir)
  return files.filter(f => f.endsWith('.json')).sort()
}

async function run() {
  const files = await listFiles()
  if (files.length === 0) return console.log('No hay archivos para reintentar')

  for (const f of files) {
    const p = path.join(dir, f)
    try {
      const raw = await fs.promises.readFile(p, 'utf8')
      const obj = JSON.parse(raw)
      const mail = obj.mail
      console.log('Reintentando:', f)
      try {
        const info = await sendMail(mail, { waitForResult: true })
        console.log('Reenvío OK:', info && info.messageId)
        // mover a subcarpeta sent/
        const sentDir = path.join(dir, 'sent')
        if (!fs.existsSync(sentDir)) await fs.promises.mkdir(sentDir, { recursive: true })
        await fs.promises.rename(p, path.join(sentDir, f))
      } catch (err) {
        console.error('Fallo reenvío:', err)
      }
    } catch (err) {
      console.error('Error leyendo/parsing:', p, err)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1) })
