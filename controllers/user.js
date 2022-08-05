const bcrypt = require('bcrypt')
const query = require('../dbHelper/index')
const pool = require('../models/index')

module.exports.restaurants = async (req, res, next) => {
    const { limit = 10, offset = 0, filter_col = 'ratings', filter_order = 'asc' } = req.query
    try {
        const restaurants = await query.getAllRestaurants(limit, offset, filter_col, filter_order)
        if (!restaurants) {
            const err = new Error('An error occured while fetching restaurants')
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const restaurantCount = restaurants.rows.length === 0 ? 0 : restaurants.rows[0].count
        const dataToSend = {
            totalRestaurants: Number(restaurantCount),
            data: restaurants.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

module.exports.dishes = async (req, res, next) => {
    const { limit = 10, offset = 0, filter_col = 'name', filter_order = 'asc' } = req.query;
    const { restId } = req.params;
    try {
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const dishes = await query.getAllDishes(limit, offset, filter_col, filter_order, restId)
        if (!dishes) {
            const err = new Error(`An error occured while fetching dishes.`)
            err.clientMessage = 'Cannot fetch dishes. Please try again later...'
            err.statusCode = 404
            return next(err)
        }
        const dishCount = dishes.rows.length === 0 ? 0 : dishes.rows[0].count
        const dataToSend = {
            totalDishes: Number(dishCount),
            data: dishes.rows,
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

module.exports.addAddress = async (req, res, next) => {
    try {
        const { address, lat, lon } = req.body
        const geopoint = `${lon}, ${lat}`
        const addressCheck = await query.checkAddressExists(req.user.userId, geopoint)
        if (addressCheck.rows.length !== 0) {
            const err = new Error(`Address already exists!`)
            err.clientMessage = `Address already exists!`
            err.statusCode = 409
            return next(err)
        }
        await query.addUserAddress(req.user.userId, address, geopoint)
        return res.status(201).send('Address added successfully')
    }
    catch (err) {
        next(err)
    }
}

module.exports.register = (async (req, res, next) => {
    const { email, password, name } = req.body
    const bcryptRounds = 10
    const client = await pool.connect()
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptRounds)
        await client.query('BEGIN')
        const result = await query.addNewUser(email, hashedPassword, name)
        const newUserId = result.rows[0].id
        await query.addRole(newUserId, 'user', newUserId)
        const newSessionId = await query.createNewSession(newUserId)
        await client.query('COMMIT')
        const userDetails = {
            sessionId: newSessionId.rows[0].session_id
        }
        res.status(201).json(userDetails)
    }
    catch (err) {
        await client.query('ROLLBACK')
        client.release();
        next(err)
    }
    client.release();
})

module.exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const getUserIdPassword = await query.getUserCredentials(email)
        if (!getUserIdPassword) {
            const err = new Error('Can not fetch user details')
            return next(err)
        }
        if (getUserIdPassword.rows.length === 0) {
            const err = new Error('User not found in database')
            err.clientMessage = `Please register first`
            err.statusCode = 400
            return next(err)
        }
        if (await bcrypt.compare(password, getUserIdPassword.rows[0].password)) {
            const newSessionId = await query.createNewSession(getUserIdPassword.rows[0].id)
            if (!newSessionId) {
                const err = new Error('Could not create user session')
                return next(err)
            }
            const userDetails = {
                sessionId: newSessionId.rows[0].session_id
            }
            return res.status(200).json(userDetails)
        }
        else {
            const err = new Error('Email and password does not match')
            err.statusCode = 401
            err.clientMessage = 'Email and password does not match'
            return next(err)
        }
    }
    catch (err) {
        next(err)
    }
}

module.exports.logout = async (req, res) => {
    try {
        const { sessionId } = req.user;
        const curr_date = new Date()
        await query.logout(curr_date.toISOString(), sessionId)
        return res.status(200).send('Successfully logged out')
    }
    catch (err) {
        next(err)
    }
}