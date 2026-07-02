import { Router } from 'express'
import documentRequestsCtrl from '../../controllers/documentRequests.js'

const router = Router()

router.post('/', documentRequestsCtrl.sendRequest)

export default router
