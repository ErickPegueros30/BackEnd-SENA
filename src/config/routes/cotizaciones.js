import express from 'express'
import { validate } from '../middlewares/validate.js'
import { cotizacionCreateSchema } from '../../validators/schemas.js'
import cotizacionesController from '../../controllers/cotizaciones.js'

const router = express.Router()

router.get('/', cotizacionesController.listCotizaciones)
router.get('/:id', cotizacionesController.getCotizacion)
// Nota: en entorno de desarrollo permitimos crear cotizaciones sin token
// para facilitar pruebas desde el frontend. En producción, restaure `verifyToken`.
router.post('/', validate(cotizacionCreateSchema), cotizacionesController.createCotizacion)

export default router
