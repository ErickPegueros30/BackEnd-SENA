import 'dotenv/config';
import pool from './src/config/db.js';

console.log('Variables de entorno:', process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW() AS now");
    const dbNow = res.rows[0].now; // Date object
    const formatted = new Date(dbNow).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    console.log('Hora actual en DB (America/Mexico_City):', formatted);
  } catch (err) {
    console.error('Error ejecutando query', err.message || err);
  } finally {
    await pool.end();
  }
}

testConnection();