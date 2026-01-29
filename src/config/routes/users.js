import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.mjs';
import * as usersCtrl from '../../controllers/users.js';

const router = Router();

// All routes protected by JWT middleware
router.use(verifyToken);

// GET /api/users/
router.get('/', usersCtrl.listUsers);

// GET /api/users/:id
router.get('/:id', usersCtrl.getUser);

// POST /api/users/  (create by admin)
router.post('/', usersCtrl.createUser);

// PATCH /api/users/:id/status
router.patch('/:id/status', usersCtrl.updateStatus);

// PATCH /api/users/:id/last-activity
router.patch('/:id/last-activity', usersCtrl.updateLastActivity);

// PATCH /api/users/:id  (update user details)
router.patch('/:id', usersCtrl.updateUser);

// DELETE /api/users/:id
router.delete('/:id', usersCtrl.deleteUser);

export default router;
