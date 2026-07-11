import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as interlaboratorioCtrl from '../../controllers/interlaboratorio.js'

const router = Router()

// Public
router.get('/', interlaboratorioCtrl.listInterlaboratorio)
router.get('/:id', interlaboratorioCtrl.getInterlaboratorio)

// Protected
router.post('/', verifyToken, interlaboratorioCtrl.createInterlaboratorio)
router.put('/:id', verifyToken, interlaboratorioCtrl.updateInterlaboratorio)
router.delete('/:id', verifyToken, interlaboratorioCtrl.deleteInterlaboratorio)

export default router
