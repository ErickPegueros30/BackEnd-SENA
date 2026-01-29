import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../../validators/schemas.js';
import authController, { login } from '../../controllers/auth.js';
import usersRouter from './users.js';
import profileRouter from './profile.js';
import eventsRouter from './events.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

// Registro de usuarios
router.post('/register', validate(registerSchema), authController.register);

// Login
router.post('/login', validate(loginSchema), login);

// Users (protected)
router.use('/users', usersRouter);
// Profile shortcuts for authenticated user
router.use('/profile', profileRouter);
// Events (public listing; protected create/update/delete)
router.use('/events', eventsRouter);

export default router;
