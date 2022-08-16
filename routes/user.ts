import express from 'express';
const router = express.Router();

import user from '../controllers/user'
import authenticateUser from '../middlewares/authenticateUser'
import validations from '../middlewares/validations';

import multer from 'multer'
const upload=multer({storage: multer.memoryStorage()})

router.get('/restaurants', user.restaurants);

router.get('/restaurants/:restId/dishes', user.dishes)

router.post('/register', validations.validateRegisterDetails, user.register)

router.post('/login', validations.validateLoginDetails, user.login)

router.post('/logout', authenticateUser, user.logout)

router.post('/addresses', authenticateUser, validations.validateAddress, user.addAddress)

export default router