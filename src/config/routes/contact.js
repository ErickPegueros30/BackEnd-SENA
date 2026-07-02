import { Router } from 'express'
import contactCtrl from '../../controllers/contactController.js'

const router = Router()

router.post('/', contactCtrl.sendContact)

export default router
