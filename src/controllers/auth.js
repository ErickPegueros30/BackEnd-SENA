import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { createUser } from '../services/userService.js';

export const register = async (req, res) => {
  try {
    const { nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena } = req.body;

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(contrasena, salt);

    // create user and credentials within service
    const result = await createUser({ nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena: hashed });

    return res.status(201).json({ ok: true, message: 'Usuario registrado', data: result });
  } catch (err) {
    // Unique constraint for correo
    if (err && err.code === '23505') {
      return res.status(409).json({ ok: false, message: 'Correo ya registrado' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ ok: false, message: 'Error al registrar usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const q = `SELECT c.contrasena, c.id_credencial, c.id_rol, c.activo, u.id_usuario, u.nombre, u.primer_apellido
               FROM credenciales c
               JOIN usuarios u ON c.id_usuario = u.id_usuario
               WHERE c.correo = $1`;
    const result = await pool.query(q, [username]);
    if (!result.rows.length) return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });

    const row = result.rows[0];
    // If the credential row explicitly marks the account inactive, reject login
    if (row.activo === false) {
      return res.status(403).json({ ok: false, message: 'Cuenta deshabilitada', data: { user: { id_usuario: row.id_usuario, nombre: row.nombre, primer_apellido: row.primer_apellido, id_rol: row.id_rol, correo: username, habilitado: false } } });
    }
    const match = bcrypt.compareSync(password, row.contrasena);
    if (!match) return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    // update last activity timestamp
    try {
      await pool.query('UPDATE credenciales SET ultima_actividad = NOW() WHERE id_usuario = $1', [row.id_usuario]);
    } catch (e) { /* ignore update errors */ }

    const user = {
      id_usuario: row.id_usuario,
      nombre: row.nombre,
      primer_apellido: row.primer_apellido,
      id_rol: row.id_rol,
      correo: username
    };

    // Sign a JWT token
    const secret = process.env.JWT_SECRET || 'clave_secreta_segura';
    const token = jwt.sign({ user }, secret, { expiresIn: '8h' });

    // fetch ultima_actividad if available
    try {
      const r2 = await pool.query('SELECT ultima_actividad FROM credenciales WHERE id_usuario = $1', [row.id_usuario]);
      if (r2.rows.length && r2.rows[0].ultima_actividad) user.ultima_actividad = r2.rows[0].ultima_actividad;
    } catch (e) { /* ignore */ }

    return res.json({ ok: true, message: 'Autenticación exitosa', data: { token, user } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, message: 'Error en autenticación' });
  }
};

export default { register };
