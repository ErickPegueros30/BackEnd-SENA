#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import pool from '../src/config/db.js'

async function run(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) {
    console.error('Archivo no encontrado:', full)
    process.exit(2)
  }
  const sql = fs.readFileSync(full, 'utf8')
  try {
    console.log('Ejecutando migración:', file)
    await pool.query(sql)
    console.log('Migración aplicada correctamente')
    process.exit(0)
  } catch (err) {
    console.error('Error aplicando migración', err)
    process.exit(1)
  }
}

const arg = process.argv[2]
if (!arg) {
  console.error('Uso: node runMigration.js <ruta-a-migacion.sql>')
  process.exit(2)
}
run(arg)
