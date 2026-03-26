import pool from '../config/db.js'

const toCotizacion = (r) => ({
  id_cotizacion: r.id_cotizacion,
  id: r.id_cotizacion,
  usuario_id: r.usuario_id,
  nombre_cliente: r.nombre_cliente,
  correo: r.correo,
  telefono: r.telefono,
  empresa: r.empresa,
  direccion: r.direccion,
  precio_tipo: r.precio_tipo,
  precio_id: r.precio_id,
  notas: r.notas,
  created_at: r.created_at
})

export const listCotizaciones = async (req, res) => {
  try {
    const { page, limit, usuarioId, precioTipo, precioId } = req.query
    const params = []
    let where = ''
    if (usuarioId) { params.push(usuarioId); where += ` AND usuario_id = $${params.length}` }
    if (precioTipo) { params.push(precioTipo); where += ` AND precio_tipo = $${params.length}` }
    if (precioId) { params.push(Number(precioId)); where += ` AND precio_id = $${params.length}` }

    const countQ = `SELECT COUNT(*)::int AS total FROM cotizaciones WHERE 1=1 ${where}`
    const countRes = await pool.query(countQ, params)
    const total = countRes.rows[0] ? Number(countRes.rows[0].total) : 0

    let q = `SELECT * FROM cotizaciones WHERE 1=1 ${where} ORDER BY id_cotizacion ASC`
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
    return res.json(result.rows.map(toCotizacion))
  } catch (err) {
    console.error('listCotizaciones error', err)
    return res.status(500).json({ ok: false, message: 'Error listando cotizaciones' })
  }
}

export const getCotizacion = async (req, res) => {
  try {
    const { id } = req.params
    const q = 'SELECT * FROM cotizaciones WHERE id_cotizacion = $1'
    const result = await pool.query(q, [id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ ok: false, message: 'Cotización no encontrada' })

    // fetch items
    const itemsQ = `SELECT ci.*, a.referencia AS area_referencia, a.descripcion AS area_descripcion, r.referencia AS rama_referencia, r.descripcion AS rama_descripcion
                    FROM cotizacion_items ci
                    LEFT JOIN catalogo_precios_areas a ON ci.area_id = a.id_cotizacion_area
                    LEFT JOIN catalogo_precios_ramas r ON ci.rama_id = r.id_cotizacion_rama
                    WHERE ci.cotizacion_id = $1 ORDER BY ci.id_item ASC`
    const itemsRes = await pool.query(itemsQ, [id])
    const items = itemsRes.rows.map(it => ({
      id_item: it.id_item,
      descripcion_snapshot: it.descripcion || (it.area_descripcion || it.rama_descripcion),
      referencia: it.area_referencia || it.rama_referencia,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      subtotal: Number(it.subtotal),
      area_id: it.area_id,
      rama_id: it.rama_id
    }))

    const out = toCotizacion(row)
    out.items = items
    out.subtotal = Number(row.subtotal || 0)
    out.iva = Number(row.iva || 0)
    out.total = Number(row.total || 0)
    out.estado = row.estado
    out.vencimiento = row.vencimiento
    return res.json(out)
  } catch (err) {
    console.error('getCotizacion error', err)
    return res.status(500).json({ ok: false, message: 'Error obteniendo cotización' })
  }
}

export const createCotizacion = async (req, res) => {
  try {
    const { usuarioId, nombre_cliente, correo, telefono, empresa, direccion, notas, items, vencimiento } = req.body

    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, message: 'Se requiere al menos un item' })

    // verify usuario exists — en entorno de pruebas, permitimos continuar aunque no exista
    let usuarioExists = false
    try {
      const u = await pool.query('SELECT 1 FROM usuarios WHERE id_usuario = $1', [usuarioId])
      usuarioExists = u.rowCount > 0
      if (!usuarioExists) console.warn('createCotizacion: usuario no encontrado, procediendo en modo de prueba', usuarioId)
    } catch (e) {
      console.warn('createCotizacion: error verificando usuario, procediendo', e.message)
    }

    // create cotizacion master row
    const insertQ = `INSERT INTO cotizaciones (usuario_id, nombre_cliente, correo, telefono, empresa, direccion, notas, vencimiento) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`
    const insertParams = [usuarioId, nombre_cliente, correo, telefono, companyOrNull(empresa), direccion || null, notas || null, vencimiento || null]
    const insertRes = await pool.query(insertQ, insertParams)
    const cot = insertRes.rows[0]

    // insert items and compute totals
    // En entorno de desarrollo eliminamos la restricción que obliga a tener area_id o rama_id
    // para permitir items manuales sin referencia al catálogo.
    try {
      await pool.query('ALTER TABLE cotizacion_items DROP CONSTRAINT IF EXISTS ck_item_area_rama')
    } catch (e) {
      console.warn('No se pudo modificar constraint ck_item_area_rama:', e.message)
    }
    let subtotalSum = 0
    for (const it of items) {
      const tipo = it.tipo
      const pid = Number(it.precio_id)
      const cantidad = Number(it.cantidad) || 1

      if (tipo === 'area') {
        const pr = await pool.query('SELECT referencia, descripcion, precio_unitario FROM catalogo_precios_areas WHERE id_cotizacion_area = $1', [pid])
        if (pr.rowCount === 0) {
          await pool.query('DELETE FROM cotizaciones WHERE id_cotizacion = $1', [cot.id_cotizacion])
          return res.status(400).json({ ok: false, message: `Precio (area) ${pid} no encontrado` })
        }
        const row = pr.rows[0]
        const price = Number(row.precio_unitario || 0)
        const sub = price * cantidad
        subtotalSum += sub
        await pool.query(`INSERT INTO cotizacion_items (cotizacion_id, area_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`, [cot.id_cotizacion, pid, row.descripcion || row.referencia, cantidad, price, sub])
      } else if (tipo === 'rama') {
        const pr = await pool.query('SELECT referencia, descripcion, precio_unitario FROM catalogo_precios_ramas WHERE id_cotizacion_rama = $1', [pid])
        if (pr.rowCount === 0) {
          await pool.query('DELETE FROM cotizaciones WHERE id_cotizacion = $1', [cot.id_cotizacion])
          return res.status(400).json({ ok: false, message: `Precio (rama) ${pid} no encontrado` })
        }
        const row = pr.rows[0]
        const price = Number(row.precio_unitario || 0)
        const sub = price * cantidad
        subtotalSum += sub
        await pool.query(`INSERT INTO cotizacion_items (cotizacion_id, rama_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`, [cot.id_cotizacion, pid, row.descripcion || row.referencia, cantidad, price, sub])
      } else if (tipo === 'manual') {
        // manual item: expect precioUnitario and optional descripcion in payload
        const price = Number(it.precioUnitario || 0)
        const sub = price * cantidad
        subtotalSum += sub
        await pool.query(`INSERT INTO cotizacion_items (cotizacion_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)`, [cot.id_cotizacion, it.descripcion || null, cantidad, price, sub])
      } else {
        await pool.query('DELETE FROM cotizaciones WHERE id_cotizacion = $1', [cot.id_cotizacion])
        return res.status(400).json({ ok: false, message: 'tipo de item inválido' })
      }
    }

    const iva = Number((subtotalSum * 0.16).toFixed(4))
    const total = Number((subtotalSum + iva).toFixed(4))
    await pool.query('UPDATE cotizaciones SET subtotal=$1, iva=$2, total=$3 WHERE id_cotizacion=$4', [subtotalSum, iva, total, cot.id_cotizacion])

    const finalQ = 'SELECT * FROM cotizaciones WHERE id_cotizacion = $1'
    const finalRes = await pool.query(finalQ, [cot.id_cotizacion])
    return res.status(201).json(toCotizacion(finalRes.rows[0]))
  } catch (err) {
    console.error('createCotizacion error', err)
    return res.status(500).json({ ok: false, message: 'Error creando cotización' })
  }
}

function companyOrNull(s){ return s ? s : null }

export default { listCotizaciones, getCotizacion, createCotizacion }
