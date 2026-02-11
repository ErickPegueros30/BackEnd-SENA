import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'

const UPLOADS_COURSES_DIR = path.join(process.cwd(), 'uploads', 'events')
const ensureUploadsDirCourses = async () => {
  try { await fs.promises.mkdir(UPLOADS_COURSES_DIR, { recursive: true }) } catch (e) { }
}

const buildThumbnailUrl = (req, miniatura) => {
  if (!miniatura) return null
  if (miniatura.startsWith('http')) return miniatura
  return `${req.protocol}://${req.get('host')}${miniatura.startsWith('/') ? '' : '/'}${miniatura}`
}

const toClientCourse = (row, req = null) => ({
  id: row.id_curso,
  title: row.titulo,
  description: row.descripcion,
  type: row.tipo,
  typeLabel: row.tipo,
  status: row.estado,
  modality: row.modalidad || 'presencial',
  location: row.ubicacion,
  startDate: row.inicio_fecha ? row.inicio_fecha.toISOString().split('T')[0] : null,
  endDate: row.fin_fecha ? row.fin_fecha.toISOString().split('T')[0] : null,
  startTime: row.inicio_hora || null,
  endTime: row.fin_hora || null,
  maxParticipants: row.max_participants,
  notes: row.notas,
  createdAt: row.created_at ? row.created_at.toISOString() : null,
  updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  thumbnailUrl: req ? buildThumbnailUrl(req, row.miniatura) : (row.miniatura || null)
})

export const listCursos = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = ''
    if (status) { params.push(status); where += ` AND c.estado = $${params.length}` }
    if (search) { params.push(`%${search}%`); where += ` AND (c.titulo ILIKE $${params.length} OR c.descripcion ILIKE $${params.length})` }

    const q = `SELECT c.* FROM cursos c WHERE 1=1 ${where} ORDER BY c.inicio_fecha DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    const result = await pool.query(q, params)
    const rows = result.rows.map(r => toClientCourse(r, req))
    return res.json(rows)
  } catch (err) {
    console.error('listCursos error', err)
    return res.status(500).json({ ok: false, message: 'Error listando cursos' })
  }
}

export const getCurso = async (req, res) => {
  try {
    const { id } = req.params
    const q = `SELECT * FROM cursos WHERE id_curso = $1`
    const result = await pool.query(q, [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Curso no encontrado' })
    return res.json(toClientCourse(row, req))
  } catch (err) {
    console.error('getCurso error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo curso' })
  }
}

export const createCurso = async (req, res) => {
  try {
    const { title, description, type, location, startDate, endDate, startTime, endTime, maxParticipants, notes, organizerId, status, modality } = req.body
    const q = `INSERT INTO cursos (titulo, descripcion, tipo, ubicacion, inicio_fecha, fin_fecha, inicio_hora, fin_hora, max_participants, notas, organizador_id, estado, modalidad, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now()) RETURNING *`
    const params = [title, description, type, location, startDate || null, endDate || null, startTime || null, endTime || null, maxParticipants || 0, notes || null, organizerId || null, status || 'activo', modality || 'presencial']
    const result = await pool.query(q, params)
    const row = result.rows[0]

    // thumbnail handling (if provided as dataURL)
    if (req.body.thumbnailDataUrl) {
      try {
        await ensureUploadsDirCourses()
        const matches = req.body.thumbnailDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (matches) {
          const mime = matches[1]
          const ext = mime.split('/')[1] || 'jpg'
          const data = matches[2]
          const buffer = Buffer.from(data, 'base64')
          const filename = `${row.id_curso}.${ext}`
          const relPath = `/uploads/events/${filename}`
          const filepath = path.join(UPLOADS_COURSES_DIR, filename)
          await fs.promises.writeFile(filepath, buffer)
          await pool.query('UPDATE cursos SET miniatura = $1 WHERE id_curso = $2', [relPath, row.id_curso])
          row.miniatura = relPath
        }
      } catch (e) { console.error('thumbnail save error', e) }
    }
    return res.status(201).json(toClientCourse(row, req))
  } catch (err) {
    console.error('createCurso error', err)
    return res.status(500).json({ ok: false, message: 'Error creando curso' })
  }
}

export const updateCurso = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, type, location, startDate, endDate, startTime, endTime, maxParticipants, notes, organizerId, status, modality } = req.body
    const q = `UPDATE cursos SET titulo = COALESCE($1, titulo), descripcion = COALESCE($2, descripcion), tipo = COALESCE($3, tipo), ubicacion = COALESCE($4, ubicacion), inicio_fecha = COALESCE($5, inicio_fecha), fin_fecha = COALESCE($6, fin_fecha), inicio_hora = COALESCE($7, inicio_hora), fin_hora = COALESCE($8, fin_hora), max_participants = COALESCE($9, max_participants), notas = COALESCE($10, notas), organizador_id = COALESCE($11, organizador_id), estado = COALESCE($12, estado), modalidad = COALESCE($13, modalidad), updated_at = now() WHERE id_curso = $14 RETURNING *`
    const params = [title, description, type, location, startDate || null, endDate || null, startTime || null, endTime || null, maxParticipants || 0, notes || null, organizerId || null, status || null, modality || null, id]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Curso no encontrado' })
    const row = result.rows[0]

    if (req.body.thumbnailDataUrl) {
      try {
        await ensureUploadsDirCourses()
        const matches = req.body.thumbnailDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (matches) {
          const mime = matches[1]
          const ext = mime.split('/')[1] || 'jpg'
          const data = matches[2]
          const buffer = Buffer.from(data, 'base64')
          const filename = `${row.id_curso}.${ext}`
          const relPath = `/uploads/events/${filename}`
          const filepath = path.join(UPLOADS_COURSES_DIR, filename)
          await fs.promises.writeFile(filepath, buffer)
          await pool.query('UPDATE cursos SET miniatura = $1 WHERE id_curso = $2', [relPath, row.id_curso])
          row.miniatura = relPath
        }
      } catch (e) { console.error('thumbnail save error', e) }
    }

    return res.json(toClientCourse(row, req))
  } catch (err) {
    console.error('updateCurso error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando curso' })
  }
}

export const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params
    try {
      const r = await pool.query('SELECT miniatura FROM cursos WHERE id_curso = $1', [id])
      const row = r.rows[0]
      if (row && row.miniatura) {
        const filename = path.basename(row.miniatura)
        const filepath = path.join(UPLOADS_COURSES_DIR, filename)
        if (fs.existsSync(filepath)) await fs.promises.unlink(filepath)
      }
    } catch (e) { }

    const result = await pool.query('DELETE FROM cursos WHERE id_curso = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Curso no encontrado' })
    return res.json({ ok: true, message: 'Curso eliminado' })
  } catch (err) {
    console.error('deleteCurso error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando curso' })
  }
}

export default { listCursos, getCurso, createCurso, updateCurso, deleteCurso }
