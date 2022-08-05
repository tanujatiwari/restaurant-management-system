const express = require('express')
const router = express.Router()
const subadmin = require('../controllers/subadmin')
const authenticateSubadmin = require('../middlewares/authenticateSubadmin')
const { validateAddRestaurant, validateAddDish, validateRegisterDetails , validateLoginDetails} = require('../middlewares/validations')

router.post('/login', validateLoginDetails, subadmin.login)

router.post('/add/user', authenticateSubadmin, validateRegisterDetails, subadmin.addUser)

router.post('/add/restaurants', authenticateSubadmin, validateAddRestaurant, subadmin.addRestaurant)

router.post('/restaurants/:restId/dishes', authenticateSubadmin, validateAddDish, subadmin.addDish)

router.post('/logout', authenticateSubadmin, subadmin.logout)

router.get('/users', authenticateSubadmin, subadmin.getUsers)

router.get('/restaurants', authenticateSubadmin, subadmin.getRestaurants)

router.get('/:restId/dishes', authenticateSubadmin, subadmin.getDishes)

module.exports = router