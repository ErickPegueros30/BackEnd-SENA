import express from 'express'
import { listInscripciones, getInscripcion, createInscripcion, updateInscripcion, deleteInscripcion } from '../../controllers/inscripciones.js'
import { verifyToken } from '../middlewares/verifyToken.mjs'

const router = express.Router()

router.get('/', listInscripciones)
router.get('/:id', getInscripcion)
router.post('/', createInscripcion) // consider protecting this if needed
router.put('/:id', verifyToken, updateInscripcion)
router.delete('/:id', verifyToken, deleteInscripcion)

export default router
