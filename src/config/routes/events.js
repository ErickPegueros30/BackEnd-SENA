import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as eventsCtrl from '../../controllers/events.js'

const router = Router()

// Public listing and read
router.get('/', eventsCtrl.listEvents)
router.get('/:id', eventsCtrl.getEvent)

// Protected actions
router.post('/', verifyToken, eventsCtrl.createEvent)
router.put('/:id', verifyToken, eventsCtrl.updateEvent)
router.delete('/:id', verifyToken, eventsCtrl.deleteEvent)
// Thumbnail upload/delete
router.post('/:id/thumbnail', verifyToken, eventsCtrl.uploadThumbnail)
router.delete('/:id/thumbnail', verifyToken, eventsCtrl.deleteThumbnail)

export default router
