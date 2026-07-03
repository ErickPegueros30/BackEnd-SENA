import { Router } from 'express'
import ensayoBilateralCtrl from '../../controllers/ensayoBilateralController.js'

const router = Router()

// POST /api/ensayobilateral -> enviar cotización de ensayo bilateral
router.post('/', ensayoBilateralCtrl.sendEnsayoBilateral)

export default router
