import express from 'express'
const router = express.Router()
import subadmin from '../controllers/subadmin'
import authenticateSubadmin from '../middlewares/authenticateSubadmin'
import validations from '../middlewares/validations'

import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

router.post('/login', validations.validateLoginDetails, subadmin.login)

router.post('/add/user', authenticateSubadmin, validations.validateRegisterDetails, subadmin.addUser)

router.post('/add/restaurants', authenticateSubadmin, upload.single('image'), validations.validateAddRestaurant, subadmin.addRestaurant)

router.post('/restaurants/:restId/dishes', authenticateSubadmin, upload.single('image'), validations.validateAddDish, subadmin.addDish)

router.post('/logout', authenticateSubadmin, subadmin.logout)

router.get('/users', authenticateSubadmin, subadmin.getUsers)

router.get('/restaurants', authenticateSubadmin, subadmin.getRestaurants)

router.get('/:restId/dishes', authenticateSubadmin, subadmin.getDishes)

router.post('/upload', authenticateSubadmin, upload.single('image'), validations.validateUploadImageDetails, subadmin.uploadImage)

export default router