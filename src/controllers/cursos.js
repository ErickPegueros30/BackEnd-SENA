import fs from 'fs'
import path from 'path'
import { sendMail } from '../config/mailer.js'
import pool from '../config/db.js'

const UPLOADS_COURSES_DIR = path.join(process.cwd(), 'uploads', 'courses')
const ensureUploadsDirCourses = async () => {
  try { await fs.promises.mkdir(UPLOADS_COURSES_DIR, { recursive: true }) } catch (e) { }
}

const buildThumbnailUrl = (req, miniatura) => {
  if (!miniatura) return null
  if (miniatura.startsWith('http')) return miniatura
  return `${req.protocol}://${req.get('host')}${miniatura.startsWith('/') ? '' : '/'}${miniatura}`
}

const safeDate = (d) => {
  if (!d) return null
  try {
    const dt = d instanceof Date ? d : new Date(d)
    if (isNaN(dt.getTime())) return null
    return dt
  } catch (e) { return null }
}

const toClientCourse = (row, req = null) => ({
  id: row.id_curso,
  title: row.titulo,
  description: row.descripcion,
  type: row.tipo,
  typeLabel: row.tipo,
  status: row.estado,
  modality: row.modalidad || 'presencial',
  modalidad: row.modalidad || 'presencial',
  // nivel / labels: DB may store nivel or tipo; provide both to frontend
  nivel: row.nivel || row.tipo || null,
  nivelLabel: row.nivel || row.tipo || null,
  location: row.ubicacion,
  startDate: (() => { const sd = safeDate(row.inicio_fecha); return sd ? sd.toISOString().split('T')[0] : null })(),
  endDate: (() => { const ed = safeDate(row.fin_fecha); return ed ? ed.toISOString().split('T')[0] : null })(),
  fechaInicio: (() => { const sd = safeDate(row.inicio_fecha); return sd ? sd.toISOString().split('T')[0] : null })(),
  fechaFin: (() => { const ed = safeDate(row.fin_fecha); return ed ? ed.toISOString().split('T')[0] : null })(),
  startTime: row.inicio_hora || null,
  endTime: row.fin_hora || null,
  maxParticipants: row.max_participants,
  capacidad: row.max_participants,
  notes: row.notas,
  temario: (() => {
    const t = row.temario || []
    if (!t) return []
    if (typeof t === 'string') {
      try { return JSON.parse(t) } catch (e) { return [String(t)] }
    }
    return Array.isArray(t) ? t : [t]
  })(),
  featured: !!row.featured,
  instructor: {
    id: row.organizador_id || row.organizer_id || null,
    name: row.org_nombre ? `${row.org_nombre}${row.org_primer_apellido ? ' ' + row.org_primer_apellido : ''}` : null,
    avatar: req ? buildThumbnailUrl(req, row.org_foto) : (row.org_foto || null)
  },
  createdAt: (() => { const d = safeDate(row.created_at); return d ? d.toISOString() : null })(),
  updatedAt: (() => { const d = safeDate(row.updated_at); return d ? d.toISOString() : null })(),
  thumbnailUrl: req ? buildThumbnailUrl(req, row.miniatura) : (row.miniatura || null)
})

export const listCursos = async (req, res) => {
  try {
    // listCursos called
    const { page = 1, limit = 50, status, search } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = ''
    if (status) { params.push(status); where += ` AND c.estado = $${params.length}` }
    if (search) { params.push(`%${search}%`); where += ` AND (c.titulo ILIKE $${params.length} OR c.descripcion ILIKE $${params.length})` }

        const q = `SELECT c.*, u.id_usuario AS organizer_id, u.nombre AS org_nombre, u.primer_apellido AS org_primer_apellido, u.foto_perfil AS org_foto
          FROM cursos c LEFT JOIN usuarios u ON c.organizador_id::text = u.id_usuario::text
          WHERE 1=1 ${where} ORDER BY c.inicio_fecha DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    // createCurso SQL prepared
    const result = await pool.query(q, params)
    const rows = []
    for (const r of result.rows) {
      try {
        rows.push(toClientCourse(r, req))
      } catch (e) {
        console.error('toClientCourse mapping error for row:', r, e && e.stack ? e.stack : e)
        // Skip problematic row but continue returning others
      }
    }
    return res.json(rows)
  } catch (err) {
    console.error('listCursos error', err && err.stack ? err.stack : err)
    return res.status(500).json({ ok: false, message: 'Error listando cursos', error: err && err.message ? err.message : String(err) })
  }
}

export const getCurso = async (req, res) => {
  try {
    // getCurso called
    const { id } = req.params
        const q = `SELECT c.*, u.id_usuario AS organizer_id, u.nombre AS org_nombre, u.primer_apellido AS org_primer_apellido, u.foto_perfil AS org_foto
          FROM cursos c LEFT JOIN usuarios u ON c.organizador_id::text = u.id_usuario::text
          WHERE id_curso = $1`
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
    // createCurso called
        // Normalize incoming field names (accept both English and Spanish payload keys)
        const title = req.body.title || req.body.titulo || null
        const description = req.body.description || req.body.descripcion || null
        const type = req.body.type || req.body.tipo || null
        const location = req.body.location || req.body.ubicacion || null
        const startDate = req.body.startDate || req.body.inicio_fecha || null
        const endDate = req.body.endDate || req.body.fin_fecha || null
        const startTime = req.body.startTime || req.body.inicio_hora || null
        const endTime = req.body.endTime || req.body.fin_hora || null
        const maxParticipants = req.body.maxParticipants || req.body.max_participants || 0
        const notes = req.body.notes || req.body.notas || null
        const organizerId = req.body.organizerId || req.body.organizador_id || req.body.organizer_id || null
        const instructorId = req.body.instructorId || req.body.instructor_id || null
        const temario = req.body.temario || null
        const status = req.body.status || req.body.estado || null
        const modality = req.body.modality || req.body.modalidad || null
        const q = `INSERT INTO cursos (titulo, descripcion, tipo, ubicacion, inicio_fecha, fin_fecha, inicio_hora, fin_hora, max_participants, notas, organizador_id, temario, estado, modalidad, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14, now(), now()) RETURNING *`
        const jsonTemario = temario ? JSON.stringify(temario) : JSON.stringify([])
        const parseIntIfNumeric = (v) => {
          if (v === null || v === undefined) return null
          if (typeof v === 'number') return v
          const s = String(v)
          if (/^[0-9]+$/.test(s)) return parseInt(s, 10)
          // preserve non-numeric IDs (e.g. 'A0002') as strings so they can be stored
          return s.length ? s : null
        }
        const organizadorParam = parseIntIfNumeric(instructorId || organizerId) || null
        const params = [title, description, type, location, startDate || null, endDate || null, startTime || null, endTime || null, maxParticipants || 0, notes || null, organizadorParam, jsonTemario, status || 'activo', modality || 'presencial']
    console.debug('updateCurso sql', q, params)
    const result = await pool.query(q, params)
    const row = result.rows[0]
    console.debug('createCurso inserted row id:', row && row.id_curso)

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
          const relPath = `/uploads/courses/${filename}`
          const filepath = path.join(UPLOADS_COURSES_DIR, filename)
          await fs.promises.writeFile(filepath, buffer)
          await pool.query('UPDATE cursos SET miniatura = $1 WHERE id_curso = $2', [relPath, row.id_curso])
          row.miniatura = relPath
        }
      } catch (e) { console.error('thumbnail save error', e) }
    }
    return res.status(201).json(toClientCourse(row, req))
  } catch (err) {
    console.error('createCurso error', err && err.stack ? err.stack : err)
    return res.status(500).json({ ok: false, message: 'Error creando curso', error: err && err.message ? err.message : String(err) })
  }
}

export const updateCurso = async (req, res) => {
  try {
    // updateCurso called
    const { id } = req.params
    // Normalize incoming field names for update as well
    const titleU = req.body.title || req.body.titulo || null
    const descriptionU = req.body.description || req.body.descripcion || null
    const typeU = req.body.type || req.body.tipo || null
    const locationU = req.body.location || req.body.ubicacion || null
    const startDateU = req.body.startDate || req.body.inicio_fecha || null
    const endDateU = req.body.endDate || req.body.fin_fecha || null
    const startTimeU = req.body.startTime || req.body.inicio_hora || null
    const endTimeU = req.body.endTime || req.body.fin_hora || null
    const maxParticipantsU = req.body.maxParticipants || req.body.max_participants || null
    const notesU = req.body.notes || req.body.notas || null
    const organizerIdU = req.body.organizerId || req.body.organizador_id || req.body.organizer_id || null
    const instructorIdU = req.body.instructorId || req.body.instructor_id || null
    const temarioU = req.body.temario || null
    const statusU = req.body.status || req.body.estado || null
    const modalityU = req.body.modality || req.body.modalidad || null
    const jsonTemarioUp = temarioU ? JSON.stringify(temarioU) : null
    const parseIntIfNumeric = (v) => {
      if (v === null || v === undefined) return null
      if (typeof v === 'number') return v
      const s = String(v)
      if (/^[0-9]+$/.test(s)) return parseInt(s, 10)
      // preserve non-numeric IDs (e.g. 'A0002') as strings so they can be stored
      return s.length ? s : null
    }
    const organizadorParamU = parseIntIfNumeric(instructorIdU || organizerIdU) || null
    const q = `UPDATE cursos SET titulo = COALESCE($1, titulo), descripcion = COALESCE($2, descripcion), tipo = COALESCE($3, tipo), ubicacion = COALESCE($4, ubicacion), inicio_fecha = COALESCE($5, inicio_fecha), fin_fecha = COALESCE($6, fin_fecha), inicio_hora = COALESCE($7, inicio_hora), fin_hora = COALESCE($8, fin_hora), max_participants = COALESCE($9, max_participants), notas = COALESCE($10, notas), organizador_id = COALESCE($11, organizador_id), temario = COALESCE($12::jsonb, temario), estado = COALESCE($13, estado), modalidad = COALESCE($14, modalidad), updated_at = now() WHERE id_curso = $15 RETURNING *`
    const params = [titleU, descriptionU, typeU, locationU, startDateU || null, endDateU || null, startTimeU || null, endTimeU || null, maxParticipantsU || 0, notesU || null, organizadorParamU, jsonTemarioUp, statusU || null, modalityU || null, id]
    // updateCurso SQL prepared
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Curso no encontrado' })
    const row = result.rows[0]
    // updateCurso result obtained

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
          const relPath = `/uploads/courses/${filename}`
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

export const uploadThumbnail = async (req, res) => {
  try {
    const { id } = req.params
    const { thumbnail } = req.body
    if (!thumbnail) return res.status(400).json({ ok: false, message: 'thumbnail missing' })
    await ensureUploadsDirCourses()
    const matches = thumbnail.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ ok: false, message: 'Invalid thumbnail format' })
    const mime = matches[1]
    const ext = mime.split('/')[1] || 'jpg'
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')
    const filename = `${id}.${ext}`
    const relPath = `/uploads/courses/${filename}`
    const filepath = path.join(UPLOADS_COURSES_DIR, filename)
    await fs.promises.writeFile(filepath, buffer)
    await pool.query('UPDATE cursos SET miniatura = $1 WHERE id_curso = $2', [relPath, id])
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
    const r = await pool.query('SELECT miniatura FROM cursos WHERE id_curso = $1', [id])
    const row = r.rows[0]
    if (row && row.miniatura) {
      const filename = path.basename(row.miniatura)
      const filepath = path.join(UPLOADS_COURSES_DIR, filename)
      if (fs.existsSync(filepath)) await fs.promises.unlink(filepath)
      await pool.query('UPDATE cursos SET miniatura = NULL WHERE id_curso = $1', [id])
    }
    return res.json({ ok: true, message: 'Miniatura eliminada' })
  } catch (err) {
    console.error('deleteThumbnail error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando miniatura' })
  }
}

export const sendCourseQuotation = async (req, res) => {
  try {
    const { nombre, empresa, email, telefono, curso, modalidad, mensaje } = req.body

    if (!nombre || !email || !telefono || !mensaje) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios' })
    }

      // Usar transporter compartido con pooling (src/config/mailer.js)

    const text = `Nombre: ${nombre}\nLaboratorio: ${empresa || ''}\nCorreo: ${email}\nTeléfono: ${telefono}\nModalidad: ${modalidad || ''}\nCurso: ${curso || ''}\n\nDescripción:\n${mensaje}`

    const html = `
  <table align="center" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);overflow:hidden;font-family:'DM Sans','Segoe UI',Arial,sans-serif;color:#1c2b14;">
    <tr>
      <td style="background:linear-gradient(135deg,#5d8a2f 0%,#7aab3d 100%);padding:30px 40px 20px;text-align:center;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#ffffff;margin:0;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">SENA</h1>
        <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px;font-weight:400;letter-spacing:2px;">Excelencia en Ensayos de Aptitud</div>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 40px 30px;background:#ffffff;">
        <div style="font-size:18px;font-weight:600;color:#1c2b14;margin-bottom:20px;border-bottom:2px solid #edf4e3;padding-bottom:12px;">
          🎓 Cotización Cursos
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Nombre:</span>
          <span style="color:#1c2b14;word-break:break-word;">${nombre}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Laboratorio:</span>
          <span style="color:#1c2b14;word-break:break-word;">${empresa || 'No especificado'}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Correo:</span>
          <span style="color:#1c2b14;word-break:break-word;">${email}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Teléfono:</span>
          <span style="color:#1c2b14;word-break:break-word;">${telefono}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Modalidad:</span>
          <span style="color:#1c2b14;word-break:break-word;">${modalidad || 'No especificada'}</span>
        </div> 

        <div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:12px;font-size:15px;line-height:1.6;color:#1c2b14;">
          <strong style="color:#5d8a2f;">Descripción del curso:</strong>
          <div style="margin-top:6px;">${(mensaje||'').replace(/\n/g, '<br/>')}</div>
        </div>

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Solicitud enviada desde el formulario de cotización de <strong style="color:#5d8a2f;">Cursos</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const defaultTo = process.env.MAIL_TO_CURSOS || process.env.MAIL_TO || process.env.MAIL_FROM || process.env.SMTP_USER
    const invited = process.env.MAIL_TO_CONTACTO_INVITADO
    const toList = invited ? [defaultTo, invited] : [defaultTo]

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: toList.join(','),
      replyTo: email,
      subject: 'COTIZACION CURSOS',
      text,
      html,
      envelope: {
        from: process.env.SMTP_USER,
        to: toList,
      },
    }

      sendMail(mailOptions)
      console.log('Cotización cursos encolada para envío')
      return res.status(201).json({ ok: true, message: 'Solicitud recibida y en proceso de envío' })
  } catch (err) {
    console.error('Error en sendCourseQuotation:', err)
    return res.status(500).json({ ok: false, message: 'Error interno enviando cotización' })
  }
}

export default { listCursos, getCurso, createCurso, updateCurso, deleteCurso, uploadThumbnail, deleteThumbnail, sendCourseQuotation }
