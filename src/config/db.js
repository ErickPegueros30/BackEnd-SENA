// db.js archivo para la configuración de la base de datos MySQL (mysql2)
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
});

// Helper: convierte placeholders tipo $1, $2 a ? (compatible con consultas existentes)
function convertPgParamsToQuestionMarks(text) {
  return text.replace(/\$(\d+)/g, '?');
}

// Intentar obtener y preparar una conexión para verificar
(async () => {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET time_zone = 'America/Mexico_City'");
    } catch (err) {
      // No fallar si la zona horaria no está disponible en el servidor
      console.error('No se pudo establecer zona horaria en sesión:', err.message || err);
    }
    conn.release();
    console.log('Conexión a MySQL exitosa');
  } catch (err) {
    console.error('Error conectando a MySQL', err);
  }
})();

// Wrappers para mantener una API similar a pg Pool
const db = {
  query: async (text, params) => {
    // Normalizar SQL escrito para PostgreSQL a MySQL cuando sea posible
    let normalized = String(text);
    // Eliminar casts Postgres (::int, ::jsonb, ::text, etc.)
    normalized = normalized.replace(/::\s*\w+\b/gi, '');
    // Quitar NULLS FIRST/LAST (MySQL no soporta)
    normalized = normalized.replace(/\bNULLS\s+(LAST|FIRST)\b/gi, '');
    // Reemplazar ILIKE por LIKE (dependiendo de la collation esto suele ser case-insensitive)
    normalized = normalized.replace(/\bILIKE\b/gi, 'LIKE');
    // Reemplazar $n = ANY(col) por JSON_CONTAINS(col, JSON_ARRAY($n)) (MySQL compatible)
    normalized = normalized.replace(/(\$\d+)\s*=\s*ANY\(\s*([^\)]+)\s*\)/gi, 'JSON_CONTAINS($2, JSON_ARRAY($1))');
    text = normalized;
    // Manejo especial: UPDATE ... RETURNING * (Postgres) -> MySQL compatible
    const hasReturningStar = /RETURNING\s+\*/i.test(text);
    const isUpdate = /^\s*UPDATE\s+/i.test(text);

    if (hasReturningStar && isUpdate) {
      // Extraer nombre de tabla
      const tableMatch = text.match(/^\s*UPDATE\s+([\w.\"']+)\s+/i);
      // Extraer condición WHERE <col> = $n
      const whereMatch = text.match(/WHERE\s+([\w.\"']+)\s*=\s*\$(\d+)/i);

      const sqlWithoutReturning = text.replace(/RETURNING\s+\*/i, '');
      const sql = convertPgParamsToQuestionMarks(sqlWithoutReturning);
      await pool.query(sql, params);

      if (tableMatch && whereMatch) {
        const table = tableMatch[1].replace(/['"\s]/g, '');
        const pk = whereMatch[1].replace(/['"\s]/g, '');
        const paramIndex = Number(whereMatch[2]) - 1;
        const idValue = params ? params[paramIndex] : undefined;
        if (idValue !== undefined) {
          const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${pk} = ?`, [idValue]);
          return { rows, rowCount: Array.isArray(rows) ? rows.length : 0 };
        }
      }

      // Fallback: ya ejecutado el UPDATE, devolver vacío
      return { rows: [] };
    }

    const sql = convertPgParamsToQuestionMarks(text);
    try {
      const [rows] = await pool.query(sql, params);
      return { rows, rowCount: Array.isArray(rows) ? rows.length : 0 };
    } catch (err) {
      console.error('DB query error', {
        message: err && err.message ? err.message : String(err),
        sql: sql,
        params: params,
      })
      throw err
    }
  },
  connect: async () => {
    const conn = await pool.getConnection();
    // cliente compatible con el uso actual en el código (BEGIN/COMMIT/ROLLBACK)
    const client = {
      query: async (text, params) => {
        const t = typeof text === 'string' ? text.trim().toUpperCase() : '';
        if (t === 'BEGIN') return await conn.beginTransaction();
        if (t === 'COMMIT') return await conn.commit();
        if (t === 'ROLLBACK') return await conn.rollback();
        const sql = convertPgParamsToQuestionMarks(text);
        const [rows] = await conn.query(sql, params);
        return { rows };
      },
      release: () => conn.release(),
    };
    try {
      await conn.query("SET time_zone = 'America/Mexico_City'");
    } catch (err) {
      // ignorar errores de zona horaria
    }
    return client;
  },
  end: () => pool.end(),
};

export default db;
