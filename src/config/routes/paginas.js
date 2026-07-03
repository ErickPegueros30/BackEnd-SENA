import { Router } from 'express'
import paginasCtrl from '../../controllers/paginas.js'
import verifyToken from '../middlewares/verifyToken.mjs'

const router = Router()

// Home sections
router.get('/home', paginasCtrl.listHome)

// Carrusel (debe ir antes de la ruta dinámica /home/:id)
router.get('/home/carrusel', paginasCtrl.listCarrusel)
router.post('/home/carrusel', verifyToken, paginasCtrl.createCarruselItem)
router.delete('/home/carrusel/:id', verifyToken, paginasCtrl.deleteCarruselItem)

// Rutas por sección / id
router.get('/home/:id', paginasCtrl.getHomeSection)

// Protected create/update
router.post('/home', verifyToken, paginasCtrl.createOrUpdateHome)
router.post('/home/:id/image', verifyToken, paginasCtrl.uploadSectionImage)

export default router
