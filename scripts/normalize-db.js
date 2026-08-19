import pool from '../src/config/db.js'
import { normalizeStoredPath } from '../src/utils/image.js'

async function normalizeTable(table, idField, colField) {
  console.log('Processing', table)
  const rows = await pool.query(`SELECT ${idField} as id, ${colField} as path FROM ${table}`)
  for (const r of rows.rows) {
    const orig = r.path
    if (!orig) continue
    if (!/public_html|\/home\//.test(String(orig))) continue
    const norm = normalizeStoredPath(orig)
    if (norm === orig) continue
    console.log(table, r.id, '->', orig, '=>', norm)
    await pool.query(`UPDATE ${table} SET ${colField} = $1 WHERE ${idField} = $2`, [norm, r.id])
  }
}

async function run() {
  try {
    await normalizeTable('p_home_carrusel', 'id_carrusel', 'ubicacion')
    await normalizeTable('blog_posts', 'id', 'featured_image')
    await normalizeTable('eventos', 'id_evento', 'miniatura')
    await normalizeTable('cursos', 'id_curso', 'miniatura')
    await normalizeTable('usuarios', 'id_usuario', 'foto_perfil')
    console.log('Done')
    process.exit(0)
  } catch (e) {
    console.error('Error', e)
    process.exit(2)
  }
}

run()
