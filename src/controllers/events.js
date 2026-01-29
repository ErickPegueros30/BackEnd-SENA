import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'

const UPLOADS_EVENTS_DIR = path.join(process.cwd(), 'uploads', 'events')
const ensureUploadsDir = async () => {
  try { await fs.promises.mkdir(UPLOADS_EVENTS_DIR, { recursive: true }) } catch (e) { }
}

const buildThumbnailUrl = (req, miniatura) => {
  if (!miniatura) return null
  if (miniatura.startsWith('http')) return miniatura
  return `${req.protocol}://${req.get('host')}${miniatura.startsWith('/') ? '' : '/'}${miniatura}`
}

const toClientEvent = (row, req = null) => ({
  id: row.id_evento,
  title: row.titulo,
  description: row.descripcion,
  type: row.tipo,
  typeLabel: row.tipo,
  featured: !!row.featured,
  startDate: row.inicio_fecha ? row.inicio_fecha.toISOString().split('T')[0] : null,
  endDate: row.fin_fecha ? row.fin_fecha.toISOString().split('T')[0] : null,
  startTime: row.inicio_hora ? row.inicio_hora : null,
  endTime: row.fin_hora ? row.fin_hora : null,
  status: row.estado,
  statusLabel: row.estado,
  modality: row.modalidad || 'presencial',
  location: row.ubicacion,
  maxParticipants: row.max_participants,
  notes: row.notas,
  createdAt: row.created_at ? row.created_at.toISOString() : null,
  updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  organizer: row.organizer_id ? { id: row.organizer_id, name: row.organizer_name, email: row.organizer_email } : null,
  participants: [],
  thumbnailUrl: req ? buildThumbnailUrl(req, row.miniatura) : (row.miniatura || null)
})

export const listEvents = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = ''
    if (status) { params.push(status); where += ` AND e.estado = $${params.length}` }
    if (search) { params.push(`%${search}%`); where += ` AND (e.titulo ILIKE $${params.length} OR e.descripcion ILIKE $${params.length})` }

    const q = `SELECT e.*, u.id_usuario as organizer_id, u.nombre as organizer_name, c.correo as organizer_email
               FROM eventos e LEFT JOIN usuarios u ON e.organizador_id = u.id_usuario LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario
               WHERE 1=1 ${where} ORDER BY e.inicio_fecha DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    const result = await pool.query(q, params)
    const rows = result.rows.map(r => toClientEvent(r, req))
    return res.json(rows)
  } catch (err) {
    console.error('listEvents error', err)
    return res.status(500).json({ ok: false, message: 'Error listando eventos' })
  }
}

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params
    const q = `SELECT e.*, u.id_usuario as organizer_id, u.nombre as organizer_name, c.correo as organizer_email
               FROM eventos e LEFT JOIN usuarios u ON e.organizador_id = u.id_usuario LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario
               WHERE e.id_evento = $1`
    const result = await pool.query(q, [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Evento no encontrado' })
    return res.json(toClientEvent(row, req))
  } catch (err) {
    console.error('getEvent error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo evento' })
  }
}

export const createEvent = async (req, res) => {
  try {
    const { title, description, type, location, startDate, endDate, startTime, endTime, maxParticipants, notes, organizerId, status, modality, featured } = req.body
    const q = `INSERT INTO eventos (titulo, descripcion, tipo, ubicacion, inicio_fecha, fin_fecha, inicio_hora, fin_hora, max_participants, notas, organizador_id, estado, featured, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now()) RETURNING *`
    const params = [title, description, type, location, startDate || null, endDate || null, startTime || null, endTime || null, maxParticipants || 0, notes || null, organizerId || null, status || 'activo', (featured != null ? featured : false)]
    const result = await pool.query(q, params)
    const row = result.rows[0]

    // If client provided a thumbnail dataURL, save it and persist miniatura path
    if (req.body.thumbnailDataUrl) {
      try {
        await ensureUploadsDir()
        const matches = req.body.thumbnailDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (matches) {
          const mime = matches[1]
          const ext = mime.split('/')[1] || 'jpg'
          const data = matches[2]
          const buffer = Buffer.from(data, 'base64')
          const filename = `${row.id_evento}.${ext}`
          const relPath = `/uploads/events/${filename}`
          const filepath = path.join(UPLOADS_EVENTS_DIR, filename)
          await fs.promises.writeFile(filepath, buffer)
          await pool.query('UPDATE eventos SET miniatura = $1 WHERE id_evento = $2', [relPath, row.id_evento])
          row.miniatura = relPath
        }
      } catch (e) { console.error('thumbnail save error', e) }
    }
    return res.status(201).json(toClientEvent(row))
  } catch (err) {
    console.error('createEvent error', err)
    return res.status(500).json({ ok: false, message: 'Error creando evento' })
  }
}

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, type, location, startDate, endDate, startTime, endTime, maxParticipants, notes, organizerId, status, modality, featured } = req.body
    const q = `UPDATE eventos SET titulo = COALESCE($1, titulo), descripcion = COALESCE($2, descripcion), tipo = COALESCE($3, tipo), ubicacion = COALESCE($4, ubicacion), inicio_fecha = COALESCE($5, inicio_fecha), fin_fecha = COALESCE($6, fin_fecha), inicio_hora = COALESCE($7, inicio_hora), fin_hora = COALESCE($8, fin_hora), max_participants = COALESCE($9, max_participants), notas = COALESCE($10, notas), organizador_id = COALESCE($11, organizador_id), estado = COALESCE($12, estado), featured = COALESCE($13, featured), updated_at = now() WHERE id_evento = $14 RETURNING *`
    const params = [title, description, type, location, startDate || null, endDate || null, startTime || null, endTime || null, maxParticipants || 0, notes || null, organizerId || null, status || null, (featured != null ? featured : null), id]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Evento no encontrado' })
    const row = result.rows[0]

    // handle thumbnailDataUrl if provided
    if (req.body.thumbnailDataUrl) {
      try {
        await ensureUploadsDir()
        const matches = req.body.thumbnailDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        if (matches) {
          const mime = matches[1]
          const ext = mime.split('/')[1] || 'jpg'
          const data = matches[2]
          const buffer = Buffer.from(data, 'base64')
          const filename = `${row.id_evento}.${ext}`
          const relPath = `/uploads/events/${filename}`
          const filepath = path.join(UPLOADS_EVENTS_DIR, filename)
          await fs.promises.writeFile(filepath, buffer)
          await pool.query('UPDATE eventos SET miniatura = $1 WHERE id_evento = $2', [relPath, row.id_evento])
          row.miniatura = relPath
        }
      } catch (e) { console.error('thumbnail save error', e) }
    }

    return res.json(toClientEvent(row, req))
  } catch (err) {
    console.error('updateEvent error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando evento' })
  }
}

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params
    // delete thumbnail file if exists
    try {
      const r = await pool.query('SELECT miniatura FROM eventos WHERE id_evento = $1', [id])
      const row = r.rows[0]
      if (row && row.miniatura) {
        const filename = path.basename(row.miniatura)
        const filepath = path.join(UPLOADS_EVENTS_DIR, filename)
        if (fs.existsSync(filepath)) await fs.promises.unlink(filepath)
      }
    } catch (e) { /* ignore */ }

    const result = await pool.query('DELETE FROM eventos WHERE id_evento = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Evento no encontrado' })
    return res.json({ ok: true, message: 'Evento eliminado' })
  } catch (err) {
    console.error('deleteEvent error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando evento' })
  }
}

export const uploadThumbnail = async (req, res) => {
  try {
    const { id } = req.params
    const { thumbnail } = req.body
    if (!thumbnail) return res.status(400).json({ ok: false, message: 'thumbnail missing' })
    await ensureUploadsDir()
    const matches = thumbnail.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ ok: false, message: 'Invalid thumbnail format' })
    const mime = matches[1]
    const ext = mime.split('/')[1] || 'jpg'
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')
    const filename = `${id}.${ext}`
    const relPath = `/uploads/events/${filename}`
    const filepath = path.join(UPLOADS_EVENTS_DIR, filename)
    await fs.promises.writeFile(filepath, buffer)
    await pool.query('UPDATE eventos SET miniatura = $1 WHERE id_evento = $2', [relPath, id])
    const url = buildThumbnailUrl(req, relPath)
    return res.json({ ok: true, thumbnailUrl: url })
  } catch (err) {
    console.error('uploadThumbnail error', err)
    return res.status(500).json({ ok: false, message: 'Error subiendo miniatura' })
  }
}

export const deleteThumbnail = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('SELECT miniatura FROM eventos WHERE id_evento = $1', [id])
    const row = r.rows[0]
    if (row && row.miniatura) {
      const filename = path.basename(row.miniatura)
      const filepath = path.join(UPLOADS_EVENTS_DIR, filename)
      if (fs.existsSync(filepath)) await fs.promises.unlink(filepath)
      await pool.query('UPDATE eventos SET miniatura = NULL WHERE id_evento = $1', [id])
    }
    return res.json({ ok: true, message: 'Miniatura eliminada' })
  } catch (err) {
    console.error('deleteThumbnail error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando miniatura' })
  }
}

export default { listEvents, getEvent, createEvent, updateEvent, deleteEvent }
