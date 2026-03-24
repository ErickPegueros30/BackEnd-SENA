import express from 'express'
import verifyToken from '../../config/middlewares/verifyToken.mjs'
import { validate } from '../middlewares/validate.js'
import {
	precioAreaCreateSchema,
	precioAreaUpdateSchema,
	precioRamaCreateSchema,
	precioRamaUpdateSchema
} from '../../validators/schemas.js'
import preciosController from '../../controllers/precios.js'

const router = express.Router()

// Areas
router.get('/areas', preciosController.listAreas)
router.get('/areas/:id', preciosController.getArea)
router.post('/areas', verifyToken, validate(precioAreaCreateSchema), preciosController.createArea)
router.put('/areas/:id', verifyToken, validate(precioAreaUpdateSchema), preciosController.updateArea)
router.delete('/areas/:id', verifyToken, preciosController.deleteArea)

// Ramas
router.get('/ramas', preciosController.listRamas)
router.get('/ramas/:id', preciosController.getRama)
router.post('/ramas', verifyToken, validate(precioRamaCreateSchema), preciosController.createRama)
router.put('/ramas/:id', verifyToken, validate(precioRamaUpdateSchema), preciosController.updateRama)
router.delete('/ramas/:id', verifyToken, preciosController.deleteRama)

export default router
