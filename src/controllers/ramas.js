import pool from '../config/db.js'

export const listRamas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ramas ORDER BY nombre')
    return res.json(result.rows)
  } catch (err) {
    console.error('listRamas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando ramas' })
  }
}

export const getRama = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('SELECT * FROM ramas WHERE id = $1', [id])
    const rama = r.rows[0]
    if (!rama) return res.status(404).json({ ok: false, message: 'Rama no encontrada' })
    const s = await pool.query('SELECT * FROM subramas WHERE rama_id = $1 ORDER BY nombre', [id])
    rama.subramas = s.rows
    return res.json(rama)
  } catch (err) {
    console.error('getRama error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo rama' })
  }
}

export const createRama = async (req, res) => {
  try {
    const { nombre, icon } = req.body
    const result = await pool.query('INSERT INTO ramas (nombre, icon) VALUES ($1, $2) RETURNING *', [nombre, icon || null])
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createRama error', err)
    return res.status(500).json({ ok: false, message: 'Error creando rama' })
  }
}

export const updateRama = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, icon } = req.body
    const result = await pool.query('UPDATE ramas SET nombre = COALESCE($1, nombre), icon = COALESCE($2, icon) WHERE id = $3 RETURNING *', [nombre || null, icon || null, id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Rama no encontrada' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error('updateRama error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando rama' })
  }
}

export const deleteRama = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM ramas WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Rama no encontrada' })
    return res.json({ ok: true, message: 'Rama eliminada' })
  } catch (err) {
    console.error('deleteRama error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando rama' })
  }
}

// Subramas
export const listSubramas = async (req, res) => {
  try {
    const { ramaId } = req.params
    const result = await pool.query('SELECT * FROM subramas WHERE rama_id = $1 ORDER BY nombre', [ramaId])
    return res.json(result.rows)
  } catch (err) {
    console.error('listSubramas error', err)
    return res.status(500).json({ ok: false, message: 'Error listando subramas' })
  }
}

export const createSubrama = async (req, res) => {
  try {
    const { ramaId } = req.params
    const { nombre } = req.body
    const result = await pool.query('INSERT INTO subramas (rama_id, nombre) VALUES ($1,$2) RETURNING *', [ramaId, nombre])
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createSubrama error', err)
    return res.status(500).json({ ok: false, message: 'Error creando subrama' })
  }
}

export const updateSubrama = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre } = req.body
    const result = await pool.query('UPDATE subramas SET nombre = COALESCE($1, nombre) WHERE id = $2 RETURNING *', [nombre || null, id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Subrama no encontrada' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error('updateSubrama error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando subrama' })
  }
}

export const deleteSubrama = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM subramas WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Subrama no encontrada' })
    return res.json({ ok: true, message: 'Subrama eliminada' })
  } catch (err) {
    console.error('deleteSubrama error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando subrama' })
  }
}

export default { listRamas, getRama, createRama, updateRama, deleteRama, listSubramas, createSubrama, updateSubrama, deleteSubrama }
