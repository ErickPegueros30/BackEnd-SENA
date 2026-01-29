import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as profileCtrl from '../../controllers/profile.js'

const router = Router()

router.use(verifyToken)

router.get('/', profileCtrl.getProfile)
router.put('/', profileCtrl.updateProfile)

// Avatar endpoints accept base64 JSON payload { avatar: 'data:image/..;base64,...' }
router.post('/avatar', profileCtrl.uploadAvatar)
router.delete('/avatar', profileCtrl.deleteAvatar)

router.get('/sessions', profileCtrl.listSessions)
router.delete('/sessions/:id', profileCtrl.revokeSession)

export default router
