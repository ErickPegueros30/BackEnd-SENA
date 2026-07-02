import { Router } from 'express'
import supportController from '../../controllers/supportController.js'

const router = Router()

// POST /api/support -> enviar solicitud de soporte
router.post('/', supportController.sendSupport)

export default router
