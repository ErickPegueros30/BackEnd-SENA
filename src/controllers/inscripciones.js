import pool from '../config/db.js'

export const listInscripciones = async (req, res) => {
  try {
    const { page = 1, limit = 100, tipo, eventoId, cursoId } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = ''
    if (tipo) { params.push(tipo); where += ` AND tipo = $${params.length}` }
    if (eventoId) { params.push(eventoId); where += ` AND evento_id = $${params.length}` }
    if (cursoId) { params.push(cursoId); where += ` AND curso_id = $${params.length}` }

    const q = `SELECT * FROM inscripciones WHERE 1=1 ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`
    params.push(Number(limit), offset)
    const result = await pool.query(q, params)
    return res.json(result.rows)
  } catch (err) {
    console.error('listInscripciones error', err)
    return res.status(500).json({ ok: false, message: 'Error listando inscripciones' })
  }
}

export const getInscripcion = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM inscripciones WHERE id_inscripcion = $1', [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Inscripción no encontrada' })
    return res.json(row)
  } catch (err) {
    console.error('getInscripcion error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo inscripción' })
  }
}

export const createInscripcion = async (req, res) => {
  try {
    const { nombre, primer_apellido, segundo_apellido, correo, telefono, empresa, cargo, area_id, subarea_id, rama_id, subrama_id, difusion, tipo, evento_id, curso_id } = req.body
    const q = `INSERT INTO inscripciones (nombre, primer_apellido, segundo_apellido, correo, telefono, empresa, cargo, area_id, subarea_id, rama_id, subrama_id, difusion, tipo, evento_id, curso_id, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now()) RETURNING *`
    const params = [nombre, primer_apellido, segundo_apellido || null, correo, telefono || null, empresa || null, cargo || null, area_id || null, subarea_id || null, rama_id || null, subrama_id || null, difusion || null, tipo, evento_id || null, curso_id || null]
    const result = await pool.query(q, params)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createInscripcion error', err)
    return res.status(500).json({ ok: false, message: 'Error creando inscripción' })
  }
}

export const updateInscripcion = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, primer_apellido, segundo_apellido, correo, telefono, empresa, cargo, area_id, subarea_id, rama_id, subrama_id, difusion, tipo, evento_id, curso_id } = req.body
    const q = `UPDATE inscripciones SET nombre = COALESCE($1, nombre), primer_apellido = COALESCE($2, primer_apellido), segundo_apellido = COALESCE($3, segundo_apellido), correo = COALESCE($4, correo), telefono = COALESCE($5, telefono), empresa = COALESCE($6, empresa), cargo = COALESCE($7, cargo), area_id = COALESCE($8, area_id), subarea_id = COALESCE($9, subarea_id), rama_id = COALESCE($10, rama_id), subrama_id = COALESCE($11, subrama_id), difusion = COALESCE($12, difusion), tipo = COALESCE($13, tipo), evento_id = COALESCE($14, evento_id), curso_id = COALESCE($15, curso_id) WHERE id_inscripcion = $16 RETURNING *`
    const params = [nombre || null, primer_apellido || null, segundo_apellido || null, correo || null, telefono || null, empresa || null, cargo || null, area_id || null, subarea_id || null, rama_id || null, subrama_id || null, difusion || null, tipo || null, evento_id || null, curso_id || null, id]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Inscripción no encontrada' })
    return res.json(result.rows[0])
  } catch (err) {
    console.error('updateInscripcion error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando inscripción' })
  }
}

export const deleteInscripcion = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM inscripciones WHERE id_inscripcion = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Inscripción no encontrada' })
    return res.json({ ok: true, message: 'Inscripción eliminada' })
  } catch (err) {
    console.error('deleteInscripcion error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando inscripción' })
  }
}

export default { listInscripciones, getInscripcion, createInscripcion, updateInscripcion, deleteInscripcion }
