import express from 'express'
const router = express.Router()
import admin from '../controllers/admin'
import authenticateAdmin from '../middlewares/authenticateAdmin'
import validations from '../middlewares/validations'

router.post('/login', validations.validateLoginDetails, admin.login)

router.post('/logout', authenticateAdmin, admin.logout)

router.get('/subadmins', authenticateAdmin, admin.getAllSubadmins)

router.get('/users', authenticateAdmin, admin.getAllUsers)

router.post('/add/member', authenticateAdmin, validations.validateAddMember, admin.addMember)

router.post('/add/restaurants', authenticateAdmin, validations.validateAddRestaurant, admin.addRestaurant)

router.post('/restaurants/:restId/dishes', authenticateAdmin, validations.validateAddDish, admin.addDish)

export default router