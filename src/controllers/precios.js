import pool from '../config/db.js'

// Map DB row to client-friendly object for areas
const toArea = (r) => ({
  // keep original DB field names for compatibility with templates
  id_cotizacion_area: r.id_cotizacion_area,
  idareacoti: r.idareacoti,
  // normalized aliases
  id: r.id_cotizacion_area,
  areaId: r.idareacoti,
  referencia: r.referencia,
  anio: r.anio,
  descripcion: r.descripcion,
  precio_unitario: r.precio_unitario != null ? Number(r.precio_unitario) : null,
  precio_desc_13: r.precio_desc_13 != null ? Number(r.precio_desc_13) : null,
  precio_ensayo_bilateral: r.precio_ensayo_bilateral != null ? Number(r.precio_ensayo_bilateral) : null,
  precio_desc_16: r.precio_desc_16 != null ? Number(r.precio_desc_16) : null,
  precio_desc_19: r.precio_desc_19 != null ? Number(r.precio_desc_19) : null,
  precio_usd: r.precio_usd != null ? Number(r.precio_usd) : null,
  precio_usd_desc_19: r.precio_usd_desc_19 != null ? Number(r.precio_usd_desc_19) : null
})

// Map DB row to client-friendly object for ramas
const toRama = (r) => ({
  // keep original DB field names for compatibility with templates
  id_cotizacion_rama: r.id_cotizacion_rama,
  idramacoti: r.idramacoti,
  // normalized aliases
  id: r.id_cotizacion_rama,
  ramaId: r.idramacoti,
  referencia: r.referencia,
  anio: r.anio,
  descripcion: r.descripcion,
  precio_unitario: r.precio_unitario != null ? Number(r.precio_unitario) : null,
  precio_bilateral: r.precio_bilateral != null ? Number(r.precio_bilateral) : null,
  precio_unitario_usd: r.precio_unitario_usd != null ? Number(r.precio_unitario_usd) : null
})

// Areas
export const listAreas = async (req, res) => {
  try {
    const { page, limit, anio, areaId } = req.query
    const params = []
    let where = ''
    if (anio) { params.push(Number(anio)); where += ` AND anio = $${params.length}` }
    if (areaId) { params.push(Number(areaId)); where += ` AND idareacoti = $${params.length}` }

    // total count for matching filter
    const countQ = `SELECT COUNT(*)::int AS total FROM catalogo_precios_areas WHERE 1=1 ${where}`
    const countRes = await pool.query(countQ, params)
    const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0

    // Order by primary id ascending (smallest -> largest)
    let q = `SELECT * FROM catalogo_precios_areas WHERE 1=1 ${where} ORDER BY id_cotizacion_area ASC`

    const selectParams = [...params]
    // If client provided limit (and optionally page), apply LIMIT/OFFSET
    if (limit) {
      const l = Number(limit) || 50
      const p = Number(page) || 1
      const offset = (p - 1) * l
      selectParams.push(l, offset)
      q += ` LIMIT $${selectParams.length-1} OFFSET $${selectParams.length}`
    }

    const result = await pool.query(q, selectParams)
    // expose total via header so frontend can show real total when pagination is used
    res.set('X-Total-Count', String(total))
    return res.json(result.rows.map(toArea))
  } catch (err) {
    console.error('listAreas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando precios (areas)' })
  }
}

export const getArea = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM catalogo_precios_areas WHERE id_cotizacion_area = $1'
    const result = await pool.query(q, [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Precio (area) no encontrada' })
    return res.json(toArea(row))
  } catch (err) {
    console.error('getArea error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo precio (area)' })
  }
}

export const createArea = async (req, res) => {
  try {
    const { areaId, referencia, anio, descripcion, precio_unitario, precio_usd_desc_19 } = req.body
    console.log('createArea body:', req.body)
    const q = `INSERT INTO catalogo_precios_areas (idareacoti, referencia, anio, descripcion, precio_unitario, precio_desc_13, precio_ensayo_bilateral, precio_desc_16, precio_desc_19, precio_usd, precio_usd_desc_19)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`
    const params = [
      areaId || null,
      referencia || null,
      anio || null,
      descripcion || null,
      precio_unitario != null ? precio_unitario : 0,
      req.body.precio_desc_13 != null ? req.body.precio_desc_13 : null,
      req.body.precio_ensayo_bilateral != null ? req.body.precio_ensayo_bilateral : null,
      req.body.precio_desc_16 != null ? req.body.precio_desc_16 : null,
      req.body.precio_desc_19 != null ? req.body.precio_desc_19 : null,
      req.body.precio_usd != null ? req.body.precio_usd : null,
      precio_usd_desc_19 != null ? precio_usd_desc_19 : null
    ]
    const result = await pool.query(q, params)
    return res.status(201).json(toArea(result.rows[0]))
  } catch (err) {
    console.error('createArea error', err && err.message, err && err.code)
    return res.status(500).json({ ok: false, message: 'Error creando precio (area)' })
  }
}

export const updateArea = async (req, res) => {
  try {
    const { id } = req.params
    const { areaId, referencia, anio, descripcion } = req.body
    const q = `UPDATE catalogo_precios_areas SET idareacoti = COALESCE($1,idareacoti), referencia = COALESCE($2,referencia), anio = COALESCE($3,anio), descripcion = COALESCE($4,descripcion), precio_unitario = COALESCE($5,precio_unitario), precio_desc_13 = COALESCE($6,precio_desc_13), precio_ensayo_bilateral = COALESCE($7,precio_ensayo_bilateral), precio_desc_16 = COALESCE($8,precio_desc_16), precio_desc_19 = COALESCE($9,precio_desc_19), precio_usd = COALESCE($10,precio_usd), precio_usd_desc_19 = COALESCE($11,precio_usd_desc_19) WHERE id_cotizacion_area = $12 RETURNING *`
    const params = [
      areaId || null,
      referencia || null,
      anio || null,
      descripcion || null,
      req.body.precio_unitario != null ? req.body.precio_unitario : null,
      req.body.precio_desc_13 != null ? req.body.precio_desc_13 : null,
      req.body.precio_ensayo_bilateral != null ? req.body.precio_ensayo_bilateral : null,
      req.body.precio_desc_16 != null ? req.body.precio_desc_16 : null,
      req.body.precio_desc_19 != null ? req.body.precio_desc_19 : null,
      req.body.precio_usd != null ? req.body.precio_usd : null,
      req.body.precio_usd_desc_19 != null ? req.body.precio_usd_desc_19 : null,
      id
    ]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Precio (area) no encontrada' })
    return res.json(toArea(result.rows[0]))
  } catch (err) {
    console.error('updateArea error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando precio (area)' })
  }
}

export const deleteArea = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM catalogo_precios_areas WHERE id_cotizacion_area = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Precio (area) no encontrada' })
    return res.json({ ok: true, message: 'Precio (area) eliminada' })
  } catch (err) {
    console.error('deleteArea error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando precio (area)' })
  }
}

// Ramas
export const listRamas = async (req, res) => {
  try {
    const { page, limit, anio, ramaId } = req.query
    const params = []
    let where = ''
    if (anio) { params.push(Number(anio)); where += ` AND anio = $${params.length}` }
    if (ramaId) { params.push(Number(ramaId)); where += ` AND idramacoti = $${params.length}` }

    // total count for matching filter
    const countQ = `SELECT COUNT(*)::int AS total FROM catalogo_precios_ramas WHERE 1=1 ${where}`
    const countRes = await pool.query(countQ, params)
    const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0

    // Order by primary id ascending (smallest -> largest)
    let q = `SELECT * FROM catalogo_precios_ramas WHERE 1=1 ${where} ORDER BY id_cotizacion_rama ASC`

    const selectParams = [...params]
    if (limit) {
      const l = Number(limit) || 50
      const p = Number(page) || 1
      const offset = (p - 1) * l
      selectParams.push(l, offset)
      q += ` LIMIT $${selectParams.length-1} OFFSET $${selectParams.length}`
    }

    const result = await pool.query(q, selectParams)
    res.set('X-Total-Count', String(total))
    return res.json(result.rows.map(toRama))
  } catch (err) {
    console.error('listRamas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando precios (ramas)' })
  }
}

export const getRama = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM catalogo_precios_ramas WHERE id_cotizacion_rama = $1'
    const result = await pool.query(q, [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Precio (rama) no encontrada' })
    return res.json(toRama(row))
  } catch (err) {
    console.error('getRama error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo precio (rama)' })
  }
}

export const createRama = async (req, res) => {
  try {
    const { ramaId, referencia, anio, descripcion } = req.body
    console.log('createRama body:', req.body)
    const q = `INSERT INTO catalogo_precios_ramas (idramacoti, referencia, anio, descripcion, precio_unitario, precio_bilateral, precio_unitario_usd)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`
    const params = [
      ramaId || null,
      referencia || null,
      anio || null,
      descripcion || null,
      req.body.precio_unitario != null ? req.body.precio_unitario : 0,
      req.body.precio_bilateral != null ? req.body.precio_bilateral : null,
      req.body.precio_unitario_usd != null ? req.body.precio_unitario_usd : null
    ]
    const result = await pool.query(q, params)
    return res.status(201).json(toRama(result.rows[0]))
  } catch (err) {
    console.error('createRama error', err && err.message, err && err.code)
    return res.status(500).json({ ok: false, message: 'Error creando precio (rama)' })
  }
}

export const updateRama = async (req, res) => {
  try {
    const { id } = req.params
    const { ramaId, referencia, anio, descripcion } = req.body
    const q = `UPDATE catalogo_precios_ramas SET idramacoti = COALESCE($1,idramacoti), referencia = COALESCE($2,referencia), anio = COALESCE($3,anio), descripcion = COALESCE($4,descripcion), precio_unitario = COALESCE($5,precio_unitario), precio_bilateral = COALESCE($6,precio_bilateral), precio_unitario_usd = COALESCE($7,precio_unitario_usd) WHERE id_cotizacion_rama = $8 RETURNING *`
    const params = [
      ramaId || null,
      referencia || null,
      anio || null,
      descripcion || null,
      req.body.precio_unitario != null ? req.body.precio_unitario : null,
      req.body.precio_bilateral != null ? req.body.precio_bilateral : null,
      req.body.precio_unitario_usd != null ? req.body.precio_unitario_usd : null,
      id
    ]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Precio (rama) no encontrada' })
    return res.json(toRama(result.rows[0]))
  } catch (err) {
    console.error('updateRama error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando precio (rama)' })
  }
}

export const deleteRama = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM catalogo_precios_ramas WHERE id_cotizacion_rama = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Precio (rama) no encontrada' })
    return res.json({ ok: true, message: 'Precio (rama) eliminada' })
  } catch (err) {
    console.error('deleteRama error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando precio (rama)' })
  }
}

export default {
  listAreas, getArea, createArea, updateArea, deleteArea,
  listRamas, getRama, createRama, updateRama, deleteRama
}
