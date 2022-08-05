const express = require('express')
const router = express.Router()
const admin = require('../controllers/admin')
const authenticateAdmin = require('../middlewares/authenticateAdmin')
const { validateAddDish, validateAddMember, validateAddRestaurant, validateLoginDetails } = require('../middlewares/validations')

router.post('/login', validateLoginDetails, admin.login)

router.post('/logout', authenticateAdmin, admin.logout)

router.get('/subadmins', authenticateAdmin, admin.getAllSubadmins)

router.get('/users', authenticateAdmin, admin.getAllUsers)

router.post('/add/member', authenticateAdmin, validateAddMember, admin.addMember)

router.post('/add/restaurants', authenticateAdmin, validateAddRestaurant, admin.addRestaurant)

router.post('/restaurants/:restId/dishes', authenticateAdmin, validateAddDish, admin.addDish)

module.exports = router