import { Router } from 'express'
import verifyToken from '../middlewares/verifyToken.mjs'
import * as blogsCtrl from '../../controllers/blogs.js'

const router = Router()

// Públicos
router.get('/',           blogsCtrl.listPosts)
router.get('/categories', blogsCtrl.listCategories)
router.get('/:id',        blogsCtrl.getPost)

// Protegidos (admin / empleado)
router.post('/',              verifyToken, blogsCtrl.createPost)
router.put('/:id',            verifyToken, blogsCtrl.updatePost)
router.delete('/:id',         verifyToken, blogsCtrl.deletePost)
router.post('/:id/image',     verifyToken, blogsCtrl.uploadImage)
router.delete('/:id/image',   verifyToken, blogsCtrl.deleteImage)

export default router
