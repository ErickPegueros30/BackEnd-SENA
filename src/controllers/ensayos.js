import pool from '../config/db.js'

const safeDate = (d) => {
  if (!d) return null
  try { const dt = d instanceof Date ? d : new Date(d); if (isNaN(dt.getTime())) return null; return dt } catch (e) { return null }
}

const columnExists = async (table, column) => {
  try {
    const q = `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`
    const r = await pool.query(q, [String(table), String(column)])
    return r.rowCount > 0
  } catch (e) {
    console.error('columnExists error', e)
    return false
  }
}

const getRamaNameById = async (ramaId) => {
  try {
    if (!ramaId) return null
    const r = await pool.query('SELECT * FROM ramas WHERE id = $1 LIMIT 1', [ramaId])
    if (r.rowCount === 0) return null
    const row = r.rows[0]
    return (row.nombre || row.name || null)
  } catch (e) {
    console.error('getRamaNameById error', e)
    return null
  }
}

const getRamaNameFromSubrama = async (subramaId) => {
  try {
    if (!subramaId) return null
    const r = await pool.query('SELECT rama_id FROM subramas WHERE id = $1 LIMIT 1', [subramaId])
    if (r.rowCount === 0) return null
    const ramaId = r.rows[0].rama_id
    return await getRamaNameById(ramaId)
  } catch (e) {
    console.error('getRamaNameFromSubrama error', e)
    return null
  }
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
  tipo: r.tipo || 'principal',
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
    // Si se listan por área, ocultar ensayos de tipo 'principal' (no se visualizan en áreas)
    if (area) { where += ` AND (tipo IS NULL OR tipo <> 'principal')` }
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
    // Si el cliente envía una rama/subrama pero no subarea, comprobamos
    // si la columna `id_subarea` admite NULL en la BD. Si no, devolvemos
    // un 400 con instrucciones para aplicar ALTER TABLE.
    if ((!body.subareaId && !body.id_subarea) && (body.ramaId || body.subramaId)) {
      try {
        const chk = await pool.query("SELECT attnotnull FROM pg_attribute WHERE attrelid = 'ensayos'::regclass AND attname = 'id_subarea'")
        if (chk && chk.rows && chk.rows[0] && chk.rows[0].attnotnull) {
          return res.status(400).json({ ok: false, message: 'La columna id_subarea en la base de datos NO permite NULL. Para crear ensayos por rama/subrama sin subárea ejecute: ALTER TABLE ensayos ALTER COLUMN id_subarea DROP NOT NULL;' })
        }
      } catch (e) {
        // si falla la comprobación, seguimos y dejamos que el INSERT falle con su error original
        console.error('createEnsayo: schema check failed', e)
      }
    }
    // Validar 'tipo' si se envía y si corresponde a ramas Agua/Alimentos
    const allowedTipos = ['principal','secundario']
    if (body.tipo && !allowedTipos.includes(String(body.tipo).toLowerCase())) {
      return res.status(400).json({ ok: false, message: "Campo 'tipo' inválido. Valores permitidos: 'principal', 'secundario'" })
    }

    const hasTipoCol = await columnExists('ensayos', 'tipo')
    // Si cliente envía 'tipo' pero la columna no existe, devolver instrucción clara
    if (body.tipo && !hasTipoCol) {
      return res.status(500).json({ ok: false, message: "Columna 'tipo' no encontrada en la base de datos. Ejecuta la migración V21__Add_tipo_to_ensayos.sql" })
    }

    // No restringimos 'tipo' a ramas específicas: se permite 'principal'/'secundario' para cualquier rama.

    // Construir INSERT dinámico según existencia de columna 'tipo'
    const baseCols = ['codigo','descripcion','ciclo','anio','id_subarea','area_id','rama_id','subrama_id','inscripcion_inicio','inscripcion_fin','fecha_inicio_ensayo','fecha_detalle']
    const values = []
    const params = []
    let idx = 1
    for (const c of baseCols) {
      params.push(
        c === 'codigo' ? body.codigo :
        c === 'descripcion' ? body.descripcion :
        c === 'ciclo' ? parseIntIfNumeric(body.ciclo) || null :
        c === 'anio' ? parseIntIfNumeric(body.anio) || null :
        c === 'id_subarea' ? parseIntIfNumeric(body.subareaId || body.id_subarea) || null :
        c === 'area_id' ? parseIntIfNumeric(body.areaId) || null :
        c === 'rama_id' ? parseIntIfNumeric(body.ramaId) || null :
        c === 'subrama_id' ? parseIntIfNumeric(body.subramaId) || null :
        c === 'inscripcion_inicio' ? normalizeDate(body.inscripcionInicio) :
        c === 'inscripcion_fin' ? normalizeDate(body.inscripcionFin) :
        c === 'fecha_inicio_ensayo' ? normalizeDate(body.fechaInicioEnsayo) :
        body.fechaDetalle || null
      )
      values.push(`$${idx}`)
      idx++
    }
    if (hasTipoCol) {
      values.push(`COALESCE($${idx}, 'principal')`)
      params.push(body.tipo || 'principal')
      idx++
    }
    // disponible
    values.push(`COALESCE($${idx}, true)`)
    params.push(typeof body.disponible === 'undefined' ? null : !!body.disponible)

    const q = `INSERT INTO ensayos (${baseCols.join(',')}${hasTipoCol ? ', tipo' : ''}, disponible) VALUES (${values.join(',')}) RETURNING *`
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
    // Validar 'tipo' si se envía
    const allowedTipos = ['principal','secundario']
    if (b.tipo && !allowedTipos.includes(String(b.tipo).toLowerCase())) {
      return res.status(400).json({ ok: false, message: "Campo 'tipo' inválido. Valores permitidos: 'principal', 'secundario'" })
    }

    const hasTipoCol = await columnExists('ensayos', 'tipo')
    if (b.tipo && !hasTipoCol) {
      return res.status(500).json({ ok: false, message: "Columna 'tipo' no encontrada en la base de datos. Ejecuta la migración V21__Add_tipo_to_ensayos.sql" })
    }

    // No restringimos 'tipo' en update: se permite 'principal'/'secundario' para cualquier rama.

    // Construir UPDATE dinámico
    const setClauses = []
    const params = []
    let idx = 1
    const add = (col, val) => { setClauses.push(`${col} = COALESCE($${idx}, ${col})`); params.push(val); idx++ }
    add('codigo', b.codigo || null)
    add('descripcion', b.descripcion || null)
    add('ciclo', parseIntIfNumeric(b.ciclo) || null)
    add('anio', parseIntIfNumeric(b.anio) || null)
    add('id_subarea', parseIntIfNumeric(b.subareaId || b.id_subarea) || null)
    add('area_id', parseIntIfNumeric(b.areaId) || null)
    add('rama_id', parseIntIfNumeric(b.ramaId) || null)
    add('subrama_id', parseIntIfNumeric(b.subramaId) || null)
    add('inscripcion_inicio', normalizeDate(b.inscripcionInicio))
    add('inscripcion_fin', normalizeDate(b.inscripcionFin))
    add('fecha_inicio_ensayo', normalizeDate(b.fechaInicioEnsayo))
    add('fecha_detalle', b.fechaDetalle || null)
    if (hasTipoCol) add('tipo', b.tipo || null)
    add('disponible', typeof b.disponible === 'undefined' ? null : !!b.disponible)

    const q = `UPDATE ensayos SET ${setClauses.join(', ')} WHERE id_ensayo = $${idx} RETURNING *`
    params.push(id)
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
