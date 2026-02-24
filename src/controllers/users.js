import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { createUser as svcCreateUser } from '../services/userService.js';

export const listUsers = async (req, res) => {
  try {
        const q = `SELECT c.id_credencial, c.correo, c.id_usuario, c.id_rol, c.activo, c.ultima_actividad, u.nombre, u.primer_apellido, u.segundo_apellido, u.foto_perfil
          FROM credenciales c
          JOIN usuarios u ON c.id_usuario = u.id_usuario
          ORDER BY u.nombre`;
    const result = await pool.query(q);
    const users = result.rows.map((r) => ({
      id_credencial: r.id_credencial,
      id_usuario: r.id_usuario,
      correo: r.correo,
      nombre: r.nombre,
      primer_apellido: r.primer_apellido,
      segundo_apellido: r.segundo_apellido,
      id_rol: r.id_rol,
      active: r.activo === undefined ? true : !!r.activo,
      ultima_actividad: r.ultima_actividad || null,
      foto_perfil: r.foto_perfil || null
    }));
    return res.json({ ok: true, data: users });
  } catch (err) {
    console.error('listUsers error', err);
    return res.status(500).json({ ok: false, message: 'Error al listar usuarios' });
  }
};

export const listInstructors = async (req, res) => {
  try {
    // Join roles to match names containing admin or emple (flexible)
    // Only return users whose credential role is Admin ('A') or Empleado ('E')
    const q = `SELECT c.id_usuario, u.nombre, u.primer_apellido, u.segundo_apellido, c.id_rol, r.nombre AS rol_nombre, u.foto_perfil
           FROM credenciales c
           JOIN usuarios u ON c.id_usuario = u.id_usuario
           LEFT JOIN roles r ON c.id_rol = r.id_rol
           WHERE c.id_rol IN ('A','E')
           ORDER BY u.nombre`;
    const result = await pool.query(q);
    const users = result.rows.map(r => ({ id: r.id_usuario, name: `${r.nombre} ${r.primer_apellido || ''}`.trim(), role: r.rol_nombre || r.id_rol, foto_perfil: r.foto_perfil || null }))
    return res.json({ ok: true, data: users })
  } catch (err) {
    console.error('listInstructors error', err)
    return res.status(500).json({ ok: false, message: 'Error al listar instructores' })
  }
}

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
        const q = `SELECT c.id_credencial, c.correo, c.id_usuario, c.id_rol, c.activo, c.ultima_actividad, u.nombre, u.primer_apellido, u.segundo_apellido, u.foto_perfil
          FROM credenciales c
          JOIN usuarios u ON c.id_usuario = u.id_usuario
          WHERE c.id_usuario = $1`;
    const result = await pool.query(q, [id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    const r = result.rows[0];
    const user = {
      id_credencial: r.id_credencial,
      id_usuario: r.id_usuario,
      correo: r.correo,
      nombre: r.nombre,
      primer_apellido: r.primer_apellido,
      segundo_apellido: r.segundo_apellido,
      id_rol: r.id_rol,
      active: r.activo === undefined ? true : !!r.activo,
      ultima_actividad: r.ultima_actividad || null,
      foto_perfil: r.foto_perfil || null
    };
    return res.json({ ok: true, data: user });
  } catch (err) {
    console.error('getUser error', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener usuario' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(contrasena, salt);
    const result = await svcCreateUser({ nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena: hashed });
    // DB default handles activo; nothing to do here
    return res.status(201).json({ ok: true, message: 'Usuario creado', data: result });
  } catch (err) {
    console.error('createUser error', err);
    if (err && err.code === '23505') return res.status(409).json({ ok: false, message: 'Correo ya registrado' });
    return res.status(500).json({ ok: false, message: 'Error al crear usuario' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params; // id_usuario
    const { active } = req.body;
    const q = 'UPDATE credenciales SET activo = $1 WHERE id_usuario = $2 RETURNING activo';
    const result = await pool.query(q, [!!active, id]);
    if (!result.rowCount) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    return res.json({ ok: true, message: 'Estado actualizado', data: { id_usuario: id, active: !!result.rows[0].activo } });
  } catch (err) {
    console.error('updateStatus error', err);
    return res.status(500).json({ ok: false, message: 'Error actualizando estado' });
  }
};

export const updateLastActivity = async (req, res) => {
  try {
    const { id } = req.params; // id_usuario
    const q = 'UPDATE credenciales SET ultima_actividad = NOW() WHERE id_usuario = $1 RETURNING ultima_actividad';
    const result = await pool.query(q, [id]);
    if (!result.rowCount) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    return res.json({ ok: true, message: 'Última actividad actualizada', data: { id_usuario: id, ultima_actividad: result.rows[0].ultima_actividad } });
  } catch (err) {
    console.error('updateLastActivity error', err);
    return res.status(500).json({ ok: false, message: 'Error actualizando última actividad' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // id_usuario
    // Delete credenciales first then usuarios (cascade may handle it)
    await pool.query('DELETE FROM credenciales WHERE id_usuario = $1', [id]);
    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    // no-op; DB cascade already removed credentials
    return res.json({ ok: true, message: 'Usuario eliminado' });
  } catch (err) {
    console.error('deleteUser error', err);
    return res.status(500).json({ ok: false, message: 'Error eliminando usuario' });
  }
};

export const updateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // id_usuario
    const { nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena } = req.body;

    await client.query('BEGIN');

    // Update usuarios
    await client.query(
      'UPDATE usuarios SET nombre = $1, primer_apellido = $2, segundo_apellido = $3 WHERE id_usuario = $4',
      [nombre, primer_apellido, segundo_apellido, id]
    );

    // Update credenciales (and password if provided)
    if (contrasena) {
      const salt = bcrypt.genSaltSync(10);
      const hashed = bcrypt.hashSync(contrasena, salt);
      await client.query(
        'UPDATE credenciales SET correo = $1, id_rol = $2, contrasena = $3 WHERE id_usuario = $4',
        [correo, id_rol, hashed, id]
      );
    } else {
      await client.query(
        'UPDATE credenciales SET correo = $1, id_rol = $2 WHERE id_usuario = $3',
        [correo, id_rol, id]
      );
    }

    await client.query('COMMIT');

    // Return updated user
    const q = `SELECT c.id_credencial, c.correo, c.id_usuario, c.id_rol, c.activo, u.nombre, u.primer_apellido, u.segundo_apellido
               FROM credenciales c
               JOIN usuarios u ON c.id_usuario = u.id_usuario
               WHERE c.id_usuario = $1`;
    const result = await pool.query(q, [id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    return res.json({ ok: true, message: 'Usuario actualizado', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateUser error', err);
    return res.status(500).json({ ok: false, message: 'Error actualizando usuario' });
  } finally {
    client.release();
  }
};

export default { listUsers, listInstructors, getUser, createUser, updateStatus, updateLastActivity, deleteUser, updateUser };
