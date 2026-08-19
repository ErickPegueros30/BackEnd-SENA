import fs from 'fs'
import path from 'path'
import pool from '../config/db.js'
import { buildImageUrl } from '../utils/image.js'
import { uploadBuffer } from '../utils/uploader.js'

const UPLOADS_BLOGS_DIR = path.join(process.cwd(), 'uploads', 'blogs')
const ensureUploadsDir = async () => {
  try { await fs.promises.mkdir(UPLOADS_BLOGS_DIR, { recursive: true }) } catch (_) { }
}
// Máximo por upload en bytes (por defecto 20 MB)
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024

// ── helpers ───────────────────────────────────────────────────────────
// Using buildImageUrl from ../utils/image.js

const slugify = (text) =>
  text
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toClient = (row, req) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  author: row.author_name || 'Sin autor',
  authorAvatar: row.author_avatar || null,
  authorTitle: row.author_role || '',
  excerpt: row.excerpt,
  content: row.content,
  thumbnail: req ? buildImageUrl(req, row.featured_image) : row.featured_image,
  image: req ? buildImageUrl(req, row.featured_image) : row.featured_image,
  category: row.category_name || '',
  categoryId: row.category_id,
  tags: row.tags || [],
  status: row.status,
  featured: !!row.featured,
  views: row.views || 0,
  likes: row.likes || 0,
  comments: row.comment_count || 0,
  readingTime: row.reading_time || 0,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  createdAt: row.created_at ? row.created_at.toISOString() : null,
  updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  publishedAt: row.published_at ? row.published_at.toISOString() : null,
})

const BASE_SELECT = `
  SELECT p.*,
         c.name   AS category_name,
         u.nombre AS author_name,
         u.id_rol AS author_role,
         (SELECT foto_perfil FROM usuarios WHERE id_usuario = p.id_usuario) AS author_avatar,
         (SELECT COUNT(*) FROM blog_comments bc WHERE bc.post_id = p.id AND bc.approved = true)::int AS comment_count
  FROM blog_posts p
  LEFT JOIN blog_categories c ON p.category_id = c.id
  LEFT JOIN usuarios u        ON p.id_usuario  = u.id_usuario`

// ── CRUD ──────────────────────────────────────────────────────────────

/** GET /api/blogs  — lista pública (solo published) o todas (admin) */
export const listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, category, tag, sort = 'newest', all } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const params = []
    let where = ''

    // Si no pide "all", solo publicados
    if (!all) {
      params.push('published')
      where += ` AND p.status = $${params.length}`
    }
    if (status && all) {
      params.push(status)
      where += ` AND p.status = $${params.length}`
    }
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length} OR p.content ILIKE $${params.length})`
    }
    if (category) {
      params.push(Number(category))
      where += ` AND p.category_id = $${params.length}`
    }
    if (tag) {
      params.push(tag)
      where += ` AND $${params.length} = ANY(p.tags)`
    }

    let orderBy = 'p.published_at DESC NULLS LAST'
    if (sort === 'oldest') orderBy = 'p.published_at ASC NULLS LAST'
    if (sort === 'popular') orderBy = 'p.views DESC'

    const countQ = `SELECT COUNT(*) FROM blog_posts p WHERE 1=1 ${where}`
    const countRes = await pool.query(countQ, params)
    const total = parseInt(countRes.rows[0].count, 10)

    const q = `${BASE_SELECT} WHERE 1=1 ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), offset)
    const result = await pool.query(q, params)

    return res.json({
      ok: true,
      data: result.rows.map(r => toClient(r, req)),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    console.error('listPosts error', err)
    return res.status(500).json({ ok: false, message: 'Error listando artículos' })
  }
}

/** GET /api/blogs/categories */
export const listCategories = async (_req, res) => {
  try {
    const q = `SELECT c.*, (SELECT COUNT(*) FROM blog_posts p WHERE p.category_id = c.id)::int AS count
               FROM blog_categories c ORDER BY c.name`
    const result = await pool.query(q)
    return res.json({ ok: true, data: result.rows })
  } catch (err) {
    console.error('listCategories error', err)
    return res.status(500).json({ ok: false, message: 'Error listando categorías' })
  }
}

/** GET /api/blogs/:id */
export const getPost = async (req, res) => {
  try {
    const { id } = req.params
    const q = `${BASE_SELECT} WHERE p.id = $1`
    const result = await pool.query(q, [id])
    if (!result.rows[0]) return res.status(404).json({ ok: false, message: 'Artículo no encontrado' })

    // Incrementar vistas
    await pool.query('UPDATE blog_posts SET views = views + 1 WHERE id = $1', [id])

    return res.json({ ok: true, data: toClient(result.rows[0], req) })
  } catch (err) {
    console.error('getPost error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo artículo' })
  }
}

/** POST /api/blogs  (protegido) */
export const createPost = async (req, res) => {
  try {
    const userId = req.user?.id_usuario || req.user?.id || req.body.userId
    if (!userId) return res.status(400).json({ ok: false, message: 'userId requerido' })

    const { title, excerpt, content, categoryId, status, featured, tags, metaTitle, metaDescription, readingTime } = req.body
    const slug = slugify(title || 'sin-titulo') + '-' + Date.now()
    const publishedAt = status === 'published' ? new Date() : null

    const q = `INSERT INTO blog_posts
      (id_usuario, category_id, title, slug, excerpt, content, status, featured, tags, meta_title, meta_description, reading_time, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`
    const params = [
      userId,
      categoryId || null,
      title,
      slug,
      excerpt || null,
      content || '',
      status || 'draft',
      featured || false,
      tags || [],
      metaTitle || null,
      metaDescription || null,
      readingTime || 0,
      publishedAt,
    ]
    const result = await pool.query(q, params)
    const row = result.rows[0]

    // Guardar imagen si viene como dataURL
    if (req.body.thumbnailDataUrl) {
      try {
        await saveImage(row.id, req.body.thumbnailDataUrl)
        const imgRow = await pool.query('SELECT featured_image FROM blog_posts WHERE id = $1', [row.id])
        row.featured_image = imgRow.rows[0]?.featured_image
      } catch (err) {
        if (err && err.message === 'FILE_TOO_LARGE') return res.status(413).json({ ok: false, message: 'Imagen demasiado grande' })
        throw err
      }
    }

    // Re-query para traer joins
    const full = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [row.id])
    return res.status(201).json({ ok: true, data: toClient(full.rows[0], req) })
  } catch (err) {
    console.error('createPost error', err)
    return res.status(500).json({ ok: false, message: 'Error creando artículo' })
  }
}

/** PUT /api/blogs/:id  (protegido) */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const { title, excerpt, content, categoryId, status, featured, tags, metaTitle, metaDescription, readingTime } = req.body

    // Si pasa a published por primera vez, fijar published_at
    let publishedClause = ''
    const extra = []
    if (status === 'published') {
      publishedClause = `, published_at = COALESCE(published_at, now())`
    }

    const slug = title ? slugify(title) + '-' + id : undefined

    const q = `UPDATE blog_posts SET
      title            = COALESCE($1, title),
      slug             = COALESCE($2, slug),
      excerpt          = COALESCE($3, excerpt),
      content          = COALESCE($4, content),
      category_id      = $5,
      status           = COALESCE($6, status),
      featured         = COALESCE($7, featured),
      tags             = COALESCE($8, tags),
      meta_title       = $9,
      meta_description = $10,
      reading_time     = COALESCE($11, reading_time),
      updated_at       = now()
      ${publishedClause}
      WHERE id = $12 RETURNING *`

    const params = [
      title || null,
      slug || null,
      excerpt !== undefined ? excerpt : null,
      content || null,
      categoryId !== undefined ? categoryId : null,
      status || null,
      featured != null ? featured : null,
      tags || null,
      metaTitle !== undefined ? metaTitle : null,
      metaDescription !== undefined ? metaDescription : null,
      readingTime || null,
      id,
    ]
    const result = await pool.query(q, params)
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Artículo no encontrado' })

    // Imagen
    if (req.body.thumbnailDataUrl) {
      try {
        await saveImage(id, req.body.thumbnailDataUrl)
      } catch (err) {
        if (err && err.message === 'FILE_TOO_LARGE') return res.status(413).json({ ok: false, message: 'Imagen demasiado grande' })
        throw err
      }
    }

    const full = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [id])
    return res.json({ ok: true, data: toClient(full.rows[0], req) })
  } catch (err) {
    console.error('updatePost error', err)
    return res.status(500).json({ ok: false, message: 'Error actualizando artículo' })
  }
}

/** DELETE /api/blogs/:id (protegido) */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    // Borrar imagen del disco
    const img = await pool.query('SELECT featured_image FROM blog_posts WHERE id = $1', [id])
    if (img.rows[0]?.featured_image) {
      const filepath = path.join(process.cwd(), img.rows[0].featured_image.replace(/^\//, ''))
      try { if (fs.existsSync(filepath)) await fs.promises.unlink(filepath) } catch (_) { }
    }
    const result = await pool.query('DELETE FROM blog_posts WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Artículo no encontrado' })
    return res.json({ ok: true, message: 'Artículo eliminado' })
  } catch (err) {
    console.error('deletePost error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando artículo' })
  }
}

/** POST /api/blogs/:id/image  (protegido) — subir/reemplazar imagen */
export const uploadImage = async (req, res) => {
  try {
    const { id } = req.params
    const { thumbnail } = req.body
    if (!thumbnail) return res.status(400).json({ ok: false, message: 'thumbnail requerido (dataURL base64)' })
    try {
      const relPath = await saveImage(id, thumbnail)
      return res.json({ ok: true, imageUrl: buildImageUrl(req, relPath) })
    } catch (err) {
      if (err && err.message === 'FILE_TOO_LARGE') return res.status(413).json({ ok: false, message: 'Imagen demasiado grande' })
      throw err
    }
  } catch (err) {
    console.error('uploadImage error', err)
    return res.status(500).json({ ok: false, message: 'Error subiendo imagen' })
  }
}

/** DELETE /api/blogs/:id/image  (protegido) */
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('SELECT featured_image FROM blog_posts WHERE id = $1', [id])
    if (r.rows[0]?.featured_image) {
      const filepath = path.join(process.cwd(), r.rows[0].featured_image.replace(/^\//, ''))
      try { if (fs.existsSync(filepath)) await fs.promises.unlink(filepath) } catch (_) { }
      await pool.query('UPDATE blog_posts SET featured_image = NULL, updated_at = now() WHERE id = $1', [id])
    }
    return res.json({ ok: true, message: 'Imagen eliminada' })
  } catch (err) {
    console.error('deleteImage error', err)
    return res.status(500).json({ ok: false, message: 'Error eliminando imagen' })
  }
}

// ── Utilidad interna para guardar imagen ──────────────────────────────
async function saveImage(postId, dataUrl) {
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!matches) throw new Error('Formato de imagen no válido')
  const ext = matches[1].split('/')[1] || 'jpg'
  const buffer = Buffer.from(matches[2], 'base64')
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('FILE_TOO_LARGE')
  const filename = `${postId}-${Date.now()}.${ext}`
  // Upload to remote (cPanel) and get public path
  const relPath = await uploadBuffer(buffer, filename, 'blogs')
  await pool.query('UPDATE blog_posts SET featured_image = $1, updated_at = now() WHERE id = $2', [relPath, postId])
  return relPath
}

export default { listPosts, listCategories, getPost, createPost, updatePost, deletePost, uploadImage, deleteImage }
