import { Router } from 'express'
import comparacionesCtrl from '../../controllers/comparacionesBilateral.js'

const router = Router()

// POST /comparaciones-bilateral
router.post('/', comparacionesCtrl.sendComparacion)

export default router
