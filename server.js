import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`El servidor está corriendo en http://localhost:${PORT}`);
});

// Manejador global de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa no manejada:', reason);
  process.exit(1);
});