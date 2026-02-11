import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as ramasCtrl from '../../controllers/ramas.js'

const router = Router()

// Public
router.get('/', ramasCtrl.listRamas)
router.get('/:id', ramasCtrl.getRama)
router.get('/:ramaId/subramas', ramasCtrl.listSubramas)

// Protected
router.post('/', verifyToken, ramasCtrl.createRama)
router.put('/:id', verifyToken, ramasCtrl.updateRama)
router.delete('/:id', verifyToken, ramasCtrl.deleteRama)

router.post('/:ramaId/subramas', verifyToken, ramasCtrl.createSubrama)
router.put('/subramas/:id', verifyToken, ramasCtrl.updateSubrama)
router.delete('/subramas/:id', verifyToken, ramasCtrl.deleteSubrama)

export default router
