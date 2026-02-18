import express from 'express'
import { listInscripciones, getInscripcion, createInscripcion, updateInscripcion, deleteInscripcion } from '../../controllers/inscripciones.js'
import verifyToken from '../middlewares/verifyToken.mjs'
import { validate } from '../middlewares/validate.js'
import { inscripcionCreateSchema, inscripcionUpdateSchema } from '../../validators/schemas.js'

const router = express.Router()

router.get('/', listInscripciones)
router.get('/:id', getInscripcion)
router.post('/', validate(inscripcionCreateSchema), createInscripcion)
router.put('/:id', verifyToken, validate(inscripcionUpdateSchema), updateInscripcion)
router.delete('/:id', verifyToken, deleteInscripcion)

export default router
