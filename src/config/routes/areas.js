import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as areasCtrl from '../../controllers/areas.js'

const router = Router()

// Public
router.get('/', areasCtrl.listAreas)
router.get('/:id', areasCtrl.getArea)
router.get('/:areaId/subareas', areasCtrl.listSubareas)

// Protected
router.post('/', verifyToken, areasCtrl.createArea)
router.put('/:id', verifyToken, areasCtrl.updateArea)
router.delete('/:id', verifyToken, areasCtrl.deleteArea)

router.post('/:areaId/subareas', verifyToken, areasCtrl.createSubarea)
router.put('/subareas/:id', verifyToken, areasCtrl.updateSubarea)
router.delete('/subareas/:id', verifyToken, areasCtrl.deleteSubarea)

export default router
