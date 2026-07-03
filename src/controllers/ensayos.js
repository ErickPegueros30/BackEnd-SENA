import pool from '../config/db.js'

const safeDate = (d) => {
  if (!d) return null
  try { const dt = d instanceof Date ? d : new Date(d); if (isNaN(dt.getTime())) return null; return dt } catch (e) { return null }
}

const toClient = (r) => ({
  id: r.id_ensayo,
  codigo: r.codigo,
  descripcion: r.descripcion,
  ciclo: r.ciclo,
  anio: r.anio,
  areaId: r.area_id || null,
  ramaId: r.rama_id || null,
  subareaId: r.id_subarea || null,
  subramaId: r.subrama_id || null,
  inscripcionInicio: (() => { const d = safeDate(r.inscripcion_inicio); return d ? d.toISOString().split('T')[0] : null })(),
  inscripcionFin: (() => { const d = safeDate(r.inscripcion_fin); return d ? d.toISOString().split('T')[0] : null })(),
  fechaInicioEnsayo: (() => { const d = safeDate(r.fecha_inicio_ensayo); return d ? d.toISOString().split('T')[0] : null })(),
  fechaDetalle: r.fecha_detalle || null,
  disponible: typeof r.disponible === 'boolean' ? r.disponible : (r.disponible === null ? null : !!r.disponible),
  precioReferencia: r.precio_referencia || null,
  createdAt: (() => { const d = safeDate(r.created_at); return d ? d.toISOString() : null })(),
  updatedAt: (() => { const d = safeDate(r.updated_at); return d ? d.toISOString() : null })(),
})

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

export const listEnsayos = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, area, rama, subarea, disponible, anio } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = 'WHERE 1=1'
    if (search) { params.push(`%${search}%`); where += ` AND (codigo ILIKE $${params.length} OR descripcion ILIKE $${params.length})` }
    if (area) { params.push(area); where += ` AND area_id = $${params.length}` }
    if (rama) { params.push(rama); where += ` AND rama_id = $${params.length}` }
    if (subarea) { params.push(subarea); where += ` AND id_subarea = $${params.length}` }
    if (typeof disponible !== 'undefined') { params.push(disponible === 'true' ? true : (disponible === 'false' ? false : null)); where += ` AND disponible = $${params.length}` }
    if (anio) { params.push(Number(anio)); where += ` AND anio = $${params.length}` }
    const q = `SELECT * FROM ensayos ${where} ORDER BY fecha_inicio_ensayo DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    const r = await pool.query(q, params)
    return res.json(r.rows.map(toClient))
  } catch (err) {
    console.error('listEnsayos error', err)
    return res.status(500).json({ ok: false, message: 'Error listando ensayos' })
  }
}

export const getEnsayo = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM ensayos WHERE id_ensayo = $1'
    const r = await pool.query(q, [id])
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Ensayo no encontrado' })
    return res.json(toClient(r.rows[0]))
  } catch (err) {
    console.error('getEnsayo error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo ensayo' })
  }
}

export const createEnsayo = async (req, res) => {
  try {
    const body = req.body || {}
    const q = `INSERT INTO ensayos (codigo, descripcion, ciclo, anio, id_subarea, area_id, rama_id, subrama_id, inscripcion_inicio, inscripcion_fin, fecha_inicio_ensayo, fecha_detalle, disponible)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13, true)) RETURNING *`
    const params = [
      body.codigo,
      body.descripcion,
      parseIntIfNumeric(body.ciclo) || null,
      parseIntIfNumeric(body.anio) || null,
      parseIntIfNumeric(body.subareaId || body.id_subarea) || null,
      parseIntIfNumeric(body.areaId) || null,
      parseIntIfNumeric(body.ramaId) || null,
      parseIntIfNumeric(body.subramaId) || null,
      normalizeDate(body.inscripcionInicio),
      normalizeDate(body.inscripcionFin),
      normalizeDate(body.fechaInicioEnsayo),
      body.fechaDetalle || null,
      typeof body.disponible === 'undefined' ? null : !!body.disponible
    ]
    const r = await pool.query(q, params)
    return res.status(201).json(toClient(r.rows[0]))
  } catch (err) {
    console.error('createEnsayo error', err)
    return res.status(500).json({ ok: false, message: 'Error creando ensayo', error: err && err.message ? err.message : String(err) })
  }
}

export const updateEnsayo = async (req, res) => {
  try {
    const { id } = req.params
    const b = req.body || {}
    const q = `UPDATE ensayos SET codigo = COALESCE($1, codigo), descripcion = COALESCE($2, descripcion), ciclo = COALESCE($3, ciclo), anio = COALESCE($4, anio), id_subarea = COALESCE($5, id_subarea), area_id = COALESCE($6, area_id), rama_id = COALESCE($7, rama_id), subrama_id = COALESCE($8, subrama_id), inscripcion_inicio = COALESCE($9, inscripcion_inicio), inscripcion_fin = COALESCE($10, inscripcion_fin), fecha_inicio_ensayo = COALESCE($11, fecha_inicio_ensayo), fecha_detalle = COALESCE($12, fecha_detalle), disponible = COALESCE($13, disponible) WHERE id_ensayo = $14 RETURNING *`
    const params = [
      b.codigo || null,
      b.descripcion || null,
      parseIntIfNumeric(b.ciclo) || null,
      parseIntIfNumeric(b.anio) || null,
      parseIntIfNumeric(b.subareaId || b.id_subarea) || null,
      parseIntIfNumeric(b.areaId) || null,
      parseIntIfNumeric(b.ramaId) || null,
      parseIntIfNumeric(b.subramaId) || null,
      normalizeDate(b.inscripcionInicio),
      normalizeDate(b.inscripcionFin),
      normalizeDate(b.fechaInicioEnsayo),
      b.fechaDetalle || null,
      typeof b.disponible === 'undefined' ? null : !!b.disponible,
      
      id
    ]
    const r = await pool.query(q, params)
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Ensayo no encontrado' })
    return res.json(toClient(r.rows[0]))
  } catch (err) {
    console.error('updateEnsayo error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando ensayo' })
  }
}

export const deleteEnsayo = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('DELETE FROM ensayos WHERE id_ensayo = $1', [id])
    if (r.rowCount === 0) return res.status(404).json({ ok: false, message: 'Ensayo no encontrado' })
    return res.json({ ok: true, message: 'Ensayo eliminado' })
  } catch (err) {
    console.error('deleteEnsayo error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando ensayo' })
  }
}

export default { listEnsayos, getEnsayo, createEnsayo, updateEnsayo, deleteEnsayo }
