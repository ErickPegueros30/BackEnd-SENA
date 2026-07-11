import pool from '../config/db.js'

const safeDate = (d) => {
  if (!d) return null
  try { const dt = d instanceof Date ? d : new Date(d); if (isNaN(dt.getTime())) return null; return dt } catch (e) { return null }
}

const toClient = (r) => {
  const inscripcionInicioDate = safeDate(r.inscripcion_inicio)
  const inscripcionFinDate = safeDate(r.inscripcion_fin)
  const fechaInicioDate = safeDate(r.fecha_inicio_interlaboratorio)
  const createdDate = safeDate(r.created_at)
  const updatedDate = safeDate(r.updated_at)
  return {
    id_interlaboratorio: r.id_interlaboratorio,
    id: r.id_interlaboratorio,
    referencia: r.referencia,
    descripcion: r.descripcion,
    anio: r.anio,
    inscripcion_inicio: inscripcionInicioDate ? inscripcionInicioDate.toISOString().split('T')[0] : null,
    inscripcion_fin: inscripcionFinDate ? inscripcionFinDate.toISOString().split('T')[0] : null,
    inscripcionInicio: inscripcionInicioDate ? inscripcionInicioDate.toISOString().split('T')[0] : null,
    inscripcionFin: inscripcionFinDate ? inscripcionFinDate.toISOString().split('T')[0] : null,
    fecha_inicio_interlaboratorio: fechaInicioDate ? fechaInicioDate.toISOString().split('T')[0] : null,
    fechaInicioInterlaboratorio: fechaInicioDate ? fechaInicioDate.toISOString().split('T')[0] : null,
    fecha_detalle: r.fecha_detalle || null,
    fechaDetalle: r.fecha_detalle || null,
    disponible: typeof r.disponible === 'boolean' ? r.disponible : (r.disponible === null ? null : !!r.disponible),
    created_at: createdDate ? createdDate.toISOString() : null,
    updated_at: updatedDate ? updatedDate.toISOString() : null,
    createdAt: createdDate ? createdDate.toISOString() : null,
    updatedAt: updatedDate ? updatedDate.toISOString() : null,
  }
}

const parseIntIfNumeric = (v) => {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  const s = String(v).trim()
  if (s === '') return null
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)
  return s
}

const normalizeDate = (d) => {
  if (!d) return null
  try { const dt = d instanceof Date ? d : new Date(d); if (isNaN(dt.getTime())) return null; return dt.toISOString().split('T')[0] } catch (e) { return null }
}

export const listInterlaboratorio = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, anio, disponible } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = 'WHERE 1=1'
    if (search) { params.push(`%${search}%`); where += ` AND (referencia ILIKE $${params.length} OR descripcion ILIKE $${params.length})` }
    if (typeof disponible !== 'undefined') { params.push(disponible === 'true' ? true : (disponible === 'false' ? false : null)); where += ` AND disponible = $${params.length}` }
    if (anio) { params.push(Number(anio)); where += ` AND anio = $${params.length}` }
    const q = `SELECT * FROM interlaboratorio ${where} ORDER BY fecha_inicio_interlaboratorio DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    const r = await pool.query(q, params)
    return res.json(r.rows.map(toClient))
  } catch (err) {
    console.error('listInterlaboratorio error', err)
    return res.status(500).json({ ok: false, message: 'Error listando interlaboratorios' })
  }
}

export const getInterlaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM interlaboratorio WHERE id_interlaboratorio = $1'
    const r = await pool.query(q, [id])
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Interlaboratorio no encontrado' })
    return res.json(toClient(r.rows[0]))
  } catch (err) {
    console.error('getInterlaboratorio error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo interlaboratorio' })
  }
}

export const createInterlaboratorio = async (req, res) => {
  try {
    const body = req.body || {}
    const q = `INSERT INTO interlaboratorio (referencia, descripcion, anio, inscripcion_inicio, inscripcion_fin, fecha_inicio_interlaboratorio, fecha_detalle, disponible)
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8, true)) RETURNING *`
    const inscripcionInicio = normalizeDate(body.inscripcion_inicio || body.inscripcionInicio)
    const inscripcionFin = normalizeDate(body.inscripcion_fin || body.inscripcionFin)
    const fechaInicio = normalizeDate(body.fecha_inicio_interlaboratorio || body.fechaInicioInterlaboratorio)
    const fechaDetalle = body.fecha_detalle || body.fechaDetalle || null
    const params = [
      body.referencia,
      body.descripcion,
      parseIntIfNumeric(body.anio) || null,
      inscripcionInicio,
      inscripcionFin,
      fechaInicio,
      fechaDetalle,
      typeof body.disponible === 'undefined' ? null : !!body.disponible
    ]
    const r = await pool.query(q, params)
    return res.status(201).json(toClient(r.rows[0]))
  } catch (err) {
    console.error('createInterlaboratorio error', err)
    return res.status(500).json({ ok: false, message: 'Error creando interlaboratorio', error: err && err.message ? err.message : String(err) })
  }
}

export const updateInterlaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const b = req.body || {}
    const q = `UPDATE interlaboratorio SET referencia = COALESCE($1, referencia), descripcion = COALESCE($2, descripcion), anio = COALESCE($3, anio), inscripcion_inicio = COALESCE($4, inscripcion_inicio), inscripcion_fin = COALESCE($5, inscripcion_fin), fecha_inicio_interlaboratorio = COALESCE($6, fecha_inicio_interlaboratorio), fecha_detalle = COALESCE($7, fecha_detalle), disponible = COALESCE($8, disponible) WHERE id_interlaboratorio = $9 RETURNING *`
    const inscripcionInicio = normalizeDate(b.inscripcion_inicio || b.inscripcionInicio)
    const inscripcionFin = normalizeDate(b.inscripcion_fin || b.inscripcionFin)
    const fechaInicio = normalizeDate(b.fecha_inicio_interlaboratorio || b.fechaInicioInterlaboratorio)
    const fechaDetalle = b.fecha_detalle || b.fechaDetalle || null
    const params = [
      b.referencia || null,
      b.descripcion || null,
      parseIntIfNumeric(b.anio) || null,
      inscripcionInicio,
      inscripcionFin,
      fechaInicio,
      fechaDetalle,
      typeof b.disponible === 'undefined' ? null : !!b.disponible,
      id
    ]
    const r = await pool.query(q, params)
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Interlaboratorio no encontrado' })
    return res.json(toClient(r.rows[0]))
  } catch (err) {
    console.error('updateInterlaboratorio error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando interlaboratorio' })
  }
}

export const deleteInterlaboratorio = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('DELETE FROM interlaboratorio WHERE id_interlaboratorio = $1', [id])
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Interlaboratorio no encontrado' })
    return res.json({ ok: true, message: 'Interlaboratorio eliminado' })
  } catch (err) {
    console.error('deleteInterlaboratorio error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando interlaboratorio' })
  }
}

export default { listInterlaboratorio, getInterlaboratorio, createInterlaboratorio, updateInterlaboratorio, deleteInterlaboratorio }
