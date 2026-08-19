import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'
import { uploadBuffer } from '../utils/uploader.js'
import { buildImageUrl } from '../utils/image.js'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars')

const ensureUploadsDir = async () => {
  try {
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true })
  } catch (e) { /* ignore */ }
}

export const getProfile = async (req, res) => {
  try {
    const tokenPayload = req.user || {}
    const userPayload = tokenPayload.user || tokenPayload
    const id = userPayload.id_usuario || userPayload.id || null
    if (!id) return res.status(400).json({ ok: false, message: 'User id missing' })

    // Try to fetch more details from DB
    const q = `SELECT c.correo, c.id_rol, c.ultima_actividad, u.nombre, u.primer_apellido, u.segundo_apellido, u.telefono, u.foto_perfil
           FROM credenciales c JOIN usuarios u ON c.id_usuario = u.id_usuario
           WHERE c.id_usuario = $1`;
    const result = await pool.query(q, [id]);
    const row = result.rows[0] || {}

    // Prefer stored foto_perfil path if present, otherwise fallback to legacy avatar file by id
    const dbFoto = row.foto_perfil || null
    let avatarUrl = null
    if (dbFoto) {
      avatarUrl = dbFoto.startsWith('http') ? dbFoto : buildImageUrl(req, dbFoto)
    } else {
      const avatarPath = path.join(UPLOADS_DIR, `${id}.jpg`)
      const avatarExists = fs.existsSync(avatarPath)
      avatarUrl = avatarExists ? `${req.protocol}://${req.get('host')}/uploads/avatars/${id}.jpg` : null
    }

    return res.json({ ok: true, data: {
      id_usuario: id,
      firstName: row.nombre || userPayload.nombre || '',
      lastName: row.primer_apellido || userPayload.primer_apellido || '',
      middleName: row.segundo_apellido || userPayload.segundo_apellido || null,
      email: row.correo || userPayload.correo || '',
      role: row.id_rol || userPayload.id_rol || userPayload.id_rol || '',
      avatarUrl,
      lastActivity: row.ultima_actividad || null,
      phone: row.telefono || null
    }})
  } catch (err) {
    console.error('getProfile error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo perfil' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const tokenPayload = req.user || {}
    const userPayload = tokenPayload.user || tokenPayload
    const id = userPayload.id_usuario || userPayload.id || null
    if (!id) return res.status(400).json({ ok: false, message: 'User id missing' })

    const { firstName, lastName, secondLastName, phone, email } = req.body

    // Update simple fields in DB if provided
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      if (firstName || lastName || typeof secondLastName !== 'undefined' || typeof phone !== 'undefined') {
        await client.query(
          'UPDATE usuarios SET nombre = COALESCE($1, nombre), primer_apellido = COALESCE($2, primer_apellido), segundo_apellido = COALESCE($3, segundo_apellido), telefono = COALESCE($4, telefono) WHERE id_usuario = $5',
          [firstName, lastName, secondLastName, phone, id]
        )
      }
      if (email) {
        await client.query('UPDATE credenciales SET correo = $1 WHERE id_usuario = $2', [email, id])
      }
      // phone not stored in DB schema; ignored here - client can persist elsewhere
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    return res.json({ ok: true, message: 'Perfil actualizado' })
  } catch (err) {
    console.error('updateProfile error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando perfil' })
  }
}

export const uploadAvatar = async (req, res) => {
  try {
    await ensureUploadsDir()
    const tokenPayload = req.user || {}
    const userPayload = tokenPayload.user || tokenPayload
    const id = userPayload.id_usuario || userPayload.id || null
    if (!id) return res.status(400).json({ ok: false, message: 'User id missing' })

    const { avatar } = req.body
    if (!avatar) return res.status(400).json({ ok: false, message: 'avatar missing' })

    // avatar expected as data URL: data:<mime>;base64,<data>
    const matches = avatar.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ ok: false, message: 'Invalid avatar format' })
    const mime = matches[1]
    const ext = mime.split('/')[1] || 'jpg'
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')

    const filename = `${id}.jpg`
    try {
      const relPath = await uploadBuffer(buffer, filename, 'avatars')
      const avatarUrl = buildImageUrl(req, relPath)
      // persist foto_perfil path in usuarios table (relative path under /uploads)
      try {
        await pool.query('UPDATE usuarios SET foto_perfil = $1 WHERE id_usuario = $2', [relPath, id])
      } catch (e) { /* ignore DB write errors */ }
      return res.json({ ok: true, avatarUrl })
    } catch (e) {
      console.error('uploadAvatar error', e)
      return res.status(500).json({ ok: false, message: 'Error subiendo avatar' })
    }
  } catch (err) {
    console.error('uploadAvatar error', err)
    return res.status(500).json({ ok: false, message: 'Error subiendo avatar' })
  }
}

export const deleteAvatar = async (req, res) => {
  try {
    const tokenPayload = req.user || {}
    const userPayload = tokenPayload.user || tokenPayload
    const id = userPayload.id_usuario || userPayload.id || null
    if (!id) return res.status(400).json({ ok: false, message: 'User id missing' })

    const filepath = path.join(UPLOADS_DIR, `${id}.jpg`)
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath)
    }
    // clear foto_perfil on DB
    try { await pool.query('UPDATE usuarios SET foto_perfil = NULL WHERE id_usuario = $1', [id]) } catch (e) { /* ignore */ }
    return res.json({ ok: true, message: 'Avatar eliminado' })
  } catch (err) {
    console.error('deleteAvatar error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando avatar' })
  }
}

export const listSessions = async (req, res) => {
  try {
    const tokenPayload = req.user || {}
    const userPayload = tokenPayload.user || tokenPayload
    const id = userPayload.id_usuario || userPayload.id || null
    if (!id) return res.status(400).json({ ok: false, message: 'User id missing' })

    // No persistent sessions store - return a mock current session
    const session = {
      id: 'current',
      device: req.headers['user-agent'] || 'unknown',
      ip: req.ip,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }
    return res.json([session])
  } catch (err) {
    console.error('listSessions error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo sesiones' })
  }
}

export const revokeSession = async (req, res) => {
  try {
    // No persistent sessions store - pretend success
    return res.json({ ok: true, message: 'Sesión revocada' })
  } catch (err) {
    console.error('revokeSession error', err)
    return res.status(500).json({ ok: false, message: 'Error revocando sesión' })
  }
}

export default { getProfile, updateProfile, uploadAvatar, deleteAvatar, listSessions, revokeSession }
