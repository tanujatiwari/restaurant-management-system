import express from 'express'
const router = express.Router()
import admin from '../controllers/admin'
import authenticateAdmin from '../middlewares/authenticateAdmin'
import validations from '../middlewares/validations'

import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

router.post('/login', validations.validateLoginDetails, admin.login)

router.post('/logout', authenticateAdmin, admin.logout)

router.get('/subadmins', authenticateAdmin, admin.getAllSubadmins)

router.get('/users', authenticateAdmin, admin.getAllUsers)

router.post('/add/member', authenticateAdmin, validations.validateAddMember, admin.addMember)

router.post('/add/restaurants', authenticateAdmin, upload.single('image'), validations.validateAddRestaurant, admin.addRestaurant)

router.post('/restaurants/:restId/dishes', authenticateAdmin, upload.single('image'), validations.validateAddDish, admin.addDish)

router.post('/upload', authenticateAdmin, upload.single('image'), validations.validateUploadImageDetails, admin.uploadImage)

export default router