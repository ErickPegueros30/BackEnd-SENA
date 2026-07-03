import { Router } from 'express'
import ensayoCtrl from '../../controllers/ensayocontroller.js'

const router = Router()

// POST /api/ensayo -> enviar correo de cotización de un ensayo específico
router.post('/', ensayoCtrl.sendEnsayoEmail)

export default router
