import pool from '../config/db.js';

export const createUser = async ({ nombre, primer_apellido, segundo_apellido, id_rol, correo, contrasena }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertUserText = `INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, id_rol)
    VALUES ($1,$2,$3,$4) RETURNING id_usuario`;
    const userRes = await client.query(insertUserText, [nombre, primer_apellido, segundo_apellido, id_rol]);
    const id_usuario = userRes.rows[0].id_usuario;

    const insertCredText = `INSERT INTO credenciales (id_rol, id_usuario, correo, contrasena)
    VALUES ($1,$2,$3,$4) RETURNING id_credencial`;
    const credRes = await client.query(insertCredText, [id_rol, id_usuario, correo, contrasena]);

    await client.query('COMMIT');
    return { id_usuario, id_credencial: credRes.rows[0].id_credencial };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

export default { createUser };
