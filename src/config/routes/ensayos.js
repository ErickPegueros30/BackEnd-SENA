import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as ensayosCtrl from '../../controllers/ensayos.js'

const router = Router()

// Public
router.get('/', ensayosCtrl.listEnsayos)
router.get('/:id', ensayosCtrl.getEnsayo)

// Protected
router.post('/', verifyToken, ensayosCtrl.createEnsayo)
router.put('/:id', verifyToken, ensayosCtrl.updateEnsayo)
router.delete('/:id', verifyToken, ensayosCtrl.deleteEnsayo)

export default router
