const express = require('express')
const router = express.Router();

const user = require('../controllers/user');
const authenticateUser = require('../middlewares/authenticateUser');
const { validateRegisterDetails, validateLoginDetails, validateAddress } = require('../middlewares/validations')

router.get('/restaurants', user.restaurants);

router.get('/restaurants/:restId/dishes', user.dishes)

router.post('/register', validateRegisterDetails, user.register)

router.post('/login', validateLoginDetails, user.login)

router.post('/logout', authenticateUser, user.logout)

router.post('/addresses', authenticateUser, validateAddress, user.addAddress)

module.exports = router