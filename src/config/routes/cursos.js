import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as cursosCtrl from '../../controllers/cursos.js'

const router = Router()

// Public listing and read
router.get('/', cursosCtrl.listCursos)
router.get('/:id', cursosCtrl.getCurso)

// Protected actions
router.post('/', verifyToken, cursosCtrl.createCurso)
router.put('/:id', verifyToken, cursosCtrl.updateCurso)
router.delete('/:id', verifyToken, cursosCtrl.deleteCurso)
// Thumbnail upload/delete
router.post('/:id/thumbnail', verifyToken, cursosCtrl.uploadThumbnail)
router.delete('/:id/thumbnail', verifyToken, cursosCtrl.deleteThumbnail)

export default router
