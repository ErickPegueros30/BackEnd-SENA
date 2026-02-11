import pool from '../config/db.js'

export const listAreas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM areas ORDER BY nombre')
    return res.json(result.rows)
  } catch (err) {
    console.error('listAreas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando áreas' })
  }
}

export const getArea = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('SELECT * FROM areas WHERE id = $1', [id])
    const area = r.rows[0]
    if (!area) return res.status(404).json({ ok: false, message: 'Área no encontrada' })
    const s = await pool.query('SELECT * FROM subareas WHERE area_id = $1 ORDER BY nombre', [id])
    area.subareas = s.rows
    return res.json(area)
  } catch (err) {
    console.error('getArea error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo área' })
  }
}

export const createArea = async (req, res) => {
  try {
    const { nombre, icon } = req.body
    const result = await pool.query('INSERT INTO areas (nombre, icon) VALUES ($1, $2) RETURNING *', [nombre, icon || null])
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createArea error', err)
    return res.status(500).json({ ok: false, message: 'Error creando área' })
  }
}

export const updateArea = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, icon } = req.body
    const result = await pool.query('UPDATE areas SET nombre = COALESCE($1, nombre), icon = COALESCE($2, icon) WHERE id = $3 RETURNING *', [nombre || null, icon || null, id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Área no encontrada' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error('updateArea error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando área' })
  }
}

export const deleteArea = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM areas WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Área no encontrada' })
    return res.json({ ok: true, message: 'Área eliminada' })
  } catch (err) {
    console.error('deleteArea error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando área' })
  }
}

// Subáreas
export const listSubareas = async (req, res) => {
  try {
    const { areaId } = req.params
    const result = await pool.query('SELECT * FROM subareas WHERE area_id = $1 ORDER BY nombre', [areaId])
    return res.json(result.rows)
  } catch (err) {
    console.error('listSubareas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando subáreas' })
  }
}

export const createSubarea = async (req, res) => {
  try {
    const { areaId } = req.params
    const { nombre } = req.body
    const result = await pool.query('INSERT INTO subareas (area_id, nombre) VALUES ($1,$2) RETURNING *', [areaId, nombre])
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createSubarea error', err)
    return res.status(500).json({ ok: false, message: 'Error creando subárea' })
  }
}

export const updateSubarea = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre } = req.body
    const result = await pool.query('UPDATE subareas SET nombre = COALESCE($1, nombre) WHERE id = $2 RETURNING *', [nombre || null, id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Subárea no encontrada' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error('updateSubarea error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando subárea' })
  }
}

export const deleteSubarea = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM subareas WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Subárea no encontrada' })
    return res.json({ ok: true, message: 'Subárea eliminada' })
  } catch (err) {
    console.error('deleteSubarea error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando subárea' })
  }
}

export default { listAreas, getArea, createArea, updateArea, deleteArea, listSubareas, createSubarea, updateSubarea, deleteSubarea }
