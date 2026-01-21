// db.js archivo para la configuración de la base de datos PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Establecer la zona horaria por sesión cuando un cliente se conecta.
// Usar la zona de Querétaro (Centro de México).
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'America/Mexico_City';").catch((err) => {
    console.error('No se pudo establecer zona horaria en sesión:', err);
  });
});

pool.connect()
  .then(() => console.log('Conexión a PostgreSQL exitosa'))
  .catch(err => console.error('Error conectando a PostgreSQL', err));

export default pool;  // Export default para usar import pool from '../db.js'
