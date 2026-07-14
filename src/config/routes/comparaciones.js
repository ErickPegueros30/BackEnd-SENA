import { Router } from 'express'
import comparacionesCtrl from '../../controllers/comparaciones.js'

const router = Router()

// POST /comparaciones
router.post('/', comparacionesCtrl.sendCotizacionComparacion)

export default router
