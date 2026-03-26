import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../../validators/schemas.js';
import authController, { login } from '../../controllers/auth.js';
import usersRouter from './users.js';
import * as usersCtrl from '../../controllers/users.js';
import profileRouter from './profile.js';
import eventsRouter from './events.js';
import areasRouter from './areas.js';
import ramasRouter from './ramas.js';
import preciosRouter from './precios.js';
import cotizacionesRouter from './cotizaciones.js';
import inscripcionesRouter from './inscripciones.js';
import cursosRouter from './cursos.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

// Registro de usuarios
router.post('/register', validate(registerSchema), authController.register);

// Login
router.post('/login', validate(loginSchema), login);

// Clientes pública: alias para lista de usuarios (solo para desarrollo/frontend sin token)
router.get('/clientes', usersCtrl.listUsers);

// Users (protected)
router.use('/users', usersRouter);
// Profile shortcuts for authenticated user
router.use('/profile', profileRouter);
// Events (public listing; protected create/update/delete)
router.use('/events', eventsRouter);
// Catalogs
router.use('/areas', areasRouter);
router.use('/ramas', ramasRouter);
// Precios (catálogos de precios)
router.use('/precios', preciosRouter);
// Cotizaciones (presupuestos/solicitudes)
router.use('/cotizaciones', cotizacionesRouter);
// Inscripciones (registro de asistentes a eventos/cursos)
router.use('/inscripciones', inscripcionesRouter);
// Cursos
router.use('/cursos', cursosRouter);

export default router;
