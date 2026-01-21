import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './config/routes/index.js';

const app = express();
// 🔧 Middlewares base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200,
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 📁 Servir archivos subidos
const ROOT_DIR = process.cwd();            
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));

// 🛣️ Rutas principales (SIN helmet por ahora)
app.use('/api', routes);

export default app;