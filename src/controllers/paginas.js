import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'

const UPLOADS_HOME_DIR = path.join(process.cwd(), 'uploads', 'pagina', 'home')
const UPLOADS_HOME_CAR_DIR = path.join(UPLOADS_HOME_DIR, 'carrusel')
const ensureDirs = async () => {
  try { await fs.promises.mkdir(UPLOADS_HOME_DIR, { recursive: true }) } catch (_) {}
  try { await fs.promises.mkdir(UPLOADS_HOME_CAR_DIR, { recursive: true }) } catch (_) {}
}
// Máximo por upload en bytes (por defecto 50 MB)
const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 50) * 1024 * 1024

const buildImageUrl = (req, imgPath) => {
  if (!imgPath) return null
  if (imgPath.startsWith('http')) return imgPath
  // Prefer explicit SITE_URL env var when present (e.g. https://sena.mx)
  const siteUrl = process.env.SITE_URL
  if (siteUrl) return siteUrl.replace(/\/$/, '') + (imgPath.startsWith('/') ? imgPath : '/' + imgPath)
  const proto = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https'
  return `${proto}://${req.get('host')}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`
}

const toClientHome = (row, req) => ({
  id: row.id_home,
  seccion: row.seccion,
  contenido: row.contenido,
  usuarioCambio: row.usuario_cambio,
  createdAt: row.created_at ? row.created_at.toISOString() : null,
  updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
})

export const listHome = async (req, res) => {
  try {
    const q = 'SELECT * FROM p_home ORDER BY id_home'
    const r = await pool.query(q)
    return res.json({ ok: true, data: r.rows.map(row => toClientHome(row, req)) })
  } catch (err) {
    console.error('listHome error', err)
    return res.status(500).json({ ok: false, message: 'Error listando home' })
  }
}

export const getHomeSection = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM p_home WHERE id_home = $1'
    const r = await pool.query(q, [id])
    if (!r.rows[0]) return res.status(404).json({ ok: false, message: 'Sección no encontrada' })
    return res.json({ ok: true, data: toClientHome(r.rows[0], req) })
  } catch (err) {
    console.error('getHomeSection error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo sección' })
  }
}

export const createOrUpdateHome = async (req, res) => {
  try {
    const { id, seccion, contenido } = req.body
    const usuarioCambio = req.user?.id_usuario || req.user?.id || null

    if (id) {
      const q = `UPDATE p_home SET seccion = COALESCE($1, seccion), contenido = COALESCE($2, contenido), usuario_cambio = COALESCE($3, usuario_cambio), updated_at = now() WHERE id_home = $4 RETURNING *`
      const r = await pool.query(q, [seccion || null, contenido || null, usuarioCambio, id])
      if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Sección no encontrada' })
      return res.json({ ok: true, data: toClientHome(r.rows[0], req) })
    }

    const q = `INSERT INTO p_home (seccion, contenido, usuario_cambio) VALUES ($1,$2,$3) RETURNING *`
    const r = await pool.query(q, [seccion || 'sin-seccion', contenido || null, usuarioCambio])
    return res.status(201).json({ ok: true, data: toClientHome(r.rows[0], req) })
  } catch (err) {
    console.error('createOrUpdateHome error', err)
    return res.status(500).json({ ok: false, message: 'Error creando/actualizando sección' })
  }
}

export const uploadSectionImage = async (req, res) => {
  try {
    const { id } = req.params
    const { imageDataUrl } = req.body
    if (!imageDataUrl) return res.status(400).json({ ok: false, message: 'imageDataUrl requerido' })
    await ensureDirs()
    const matches = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ ok: false, message: 'Formato de imagen no válido' })
    const ext = matches[1].split('/')[1] || 'jpg'
    const buffer = Buffer.from(matches[2], 'base64')
    if (buffer.length > MAX_UPLOAD_BYTES) return res.status(413).json({ ok: false, message: 'Imagen demasiado grande' })
    const filename = `home-${id || 'new'}-${Date.now()}.${ext}`
    const relPath = `/uploads/pagina/home/${filename}`
    await fs.promises.writeFile(path.join(UPLOADS_HOME_DIR, filename), buffer)

    if (id) await pool.query('UPDATE p_home SET contenido = $1, updated_at = now() WHERE id_home = $2', [relPath, id])

    return res.json({ ok: true, imageUrl: buildImageUrl(req, relPath) })
  } catch (err) {
    console.error('uploadSectionImage error', err)
    return res.status(500).json({ ok: false, message: 'Error subiendo imagen' })
  }
}

// Carrusel: listar, crear, eliminar
export const listCarrusel = async (req, res) => {
  try {
    const { id_home } = req.query
    const q = id_home ? 'SELECT * FROM p_home_carrusel WHERE id_home = $1 ORDER BY orden' : 'SELECT * FROM p_home_carrusel ORDER BY id_carrusel'
    const params = id_home ? [id_home] : []
    const r = await pool.query(q, params)
    return res.json({ ok: true, data: r.rows.map(row => ({ id: row.id_carrusel, id_home: row.id_home, ubicacion: req ? buildImageUrl(req, row.ubicacion) : row.ubicacion, estatus: row.estatus, orden: row.orden })) })
  } catch (err) {
    console.error('listCarrusel error', err)
    return res.status(500).json({ ok: false, message: 'Error listando carrusel' })
  }
}

export const createCarruselItem = async (req, res) => {
  try {
    const { id_home, estatus = true, orden = 0, imageDataUrl } = req.body
    if (!id_home) return res.status(400).json({ ok: false, message: 'id_home requerido' })
    await ensureDirs()
    let relPath = null
    if (imageDataUrl) {
      const matches = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!matches) return res.status(400).json({ ok: false, message: 'Formato de imagen no válido' })
      const ext = matches[1].split('/')[1] || 'jpg'
      const buffer = Buffer.from(matches[2], 'base64')
      if (buffer.length > MAX_UPLOAD_BYTES) return res.status(413).json({ ok: false, message: 'Imagen demasiado grande' })
      const filename = `carrusel-${Date.now()}.${ext}`
      relPath = `/uploads/pagina/home/carrusel/${filename}`
      await fs.promises.writeFile(path.join(UPLOADS_HOME_CAR_DIR, filename), buffer)
    }
    const q = 'INSERT INTO p_home_carrusel (id_home, ubicacion, estatus, orden) VALUES ($1,$2,$3,$4) RETURNING *'
    const r = await pool.query(q, [id_home, relPath, estatus, orden])
    return res.status(201).json({ ok: true, data: r.rows[0] })
  } catch (err) {
    console.error('createCarruselItem error', err)
    return res.status(500).json({ ok: false, message: 'Error creando item de carrusel' })
  }
}

export const deleteCarruselItem = async (req, res) => {
  try {
    const { id } = req.params
    const r1 = await pool.query('SELECT ubicacion FROM p_home_carrusel WHERE id_carrusel = $1', [id])
    if (r1.rows[0]?.ubicacion) {
      const filepath = path.join(process.cwd(), r1.rows[0].ubicacion.replace(/^[\\/]/, ''))
      try { if (fs.existsSync(filepath)) await fs.promises.unlink(filepath) } catch (_) {}
    }
    const r = await pool.query('DELETE FROM p_home_carrusel WHERE id_carrusel = $1', [id])
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Item no encontrado' })
    return res.json({ ok: true, message: 'Item eliminado' })
  } catch (err) {
    console.error('deleteCarruselItem error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando item' })
  }
}

export default {
  listHome, getHomeSection, createOrUpdateHome, uploadSectionImage,
  listCarrusel, createCarruselItem, deleteCarruselItem
}
