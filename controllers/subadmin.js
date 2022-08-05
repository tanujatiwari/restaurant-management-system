const bcrypt = require('bcrypt')
const query = require('../dbHelper/index')
const pool = require('../models/index')

module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const getSubadminCredentials = await query.getAdminCredentials(email, 'subadmin')
        if (!getSubadminCredentials) {
            const err = new Error('Can not find subadmin details')
            return next(err)
        }
        if (getSubadminCredentials.rows.length === 0) {
            const err = new Error('Subadmin not found in database')
            err.clientMessage = `Please enter correct subadmin credentials`
            err.statusCode = 400
            return next(err)
        }
        const hashedPassword = getSubadminCredentials.rows[0].password
        if (await bcrypt.compare(password, hashedPassword)) {
            const createSession = await query.createNewSession(getSubadminCredentials.rows[0].id)
            const userDetails = {
                sessionId: createSession.rows[0].session_id
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

module.exports.logout = async (req, res, next) => {
    try {
        const { sessionId } = req.subadmin;
        const curr_date = new Date()
        await query.logout(curr_date.toISOString(), sessionId)
        return res.status(200).send('Successfully logged out')
    }
    catch (err) {
        next(err)
    }
}

module.exports.addUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    const subadminId = req.subadmin.subadminId
    const bcryptRounds = 10;
    const client = await pool.connect()
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptRounds);
        await client.query('BEGIN')
        await query.addUser(email, hashedPassword, name)
        await query.getUserCredentials(email)
        const newUserId = userId.rows[0].id;
        const checkUserRole = await query.checkUserRoleExists(newUserId, 'user')
        if (checkUserRole.rows.length !== 0) {
            const err = new Error(`User with user role already exists!`)
            err.statusCode = 400
            err.clientMessage = `User with user role already exists!`
            throw err
        }
        await query.addRole(newUserId, 'user', subadminId)
        await client.query('COMMIT')
        res.status(201).send('User added')
    }
    catch (err) {
        await client.query('ROLLBACK')
        client.release()
        next(err)
    }
    client.release()
}

module.exports.addRestaurant = async (req, res, next) => {
    const { name, lat, lon } = req.body;
    const geopoint = `${lon}, ${lat}`;
    try {
        const subadminId = req.subadmin.subadminId
        const checkRestaurantExists = await query.checkRestaurantExists(name, geopoint);
        if (checkRestaurantExists.rows.length !== 0) {
            const err = new Error(`Restaurant already exists!`)
            err.statusCode = 400
            err.clientMessage = `Restaurant already exists!`
            return next(err)
        }
        await query.addRest(name, geopoint, subadminId)
        res.status(201).send('Restaurant added')
    }
    catch (err) {
        next(err)
    }
}

module.exports.addDish = async (req, res, next) => {
    const { name, description } = req.body;
    const { restId } = req.params
    try {
        const subadminId = req.subadmin.subadminId
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const checkDishExists = await query.checkDishExists(name, restId);
        if (checkDishExists.rows.length !== 0) {
            const err = new Error(`Dish at restaurant already exists!`)
            err.statusCode = 400
            err.clientMessage = `Dish at restaurant already exists!`
            return next(err)
        }
        await query.addDish(name, description, subadminId, restId)
        res.status(201).send('Dish added to your restaurant!')
    }
    catch (err) {
        next(err)
    }
}

module.exports.getUsers = async (req, res, next) => {
    const { limit = 10, offset = 0, filter_col = 'name', filter_order = 'asc' } = req.query
    try {
        const subadminId = req.subadmin.subadminId
        const allUsers = await query.getUsersBySubadmin(subadminId, filter_col, filter_order, limit, offset)
        if (!result) {
            const err = new Error('An error occured while fetching users')
            err.clientMessage = 'Cannot fetch users. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const userIdArray = allUsers.rows.map(e => e.user_id)
        const allUsersAddresses = await query.getAllAddresses(userIdArray);
        allUsersAddresses.rows.forEach(item => {
            if (!addressMap.has(item.user_id)) {
                addressMap.set(item.user_id, [item.address])
            }
            else {
                addressMap.get(item.user_id).push(item.address)
            }
        })
        allUsers.rows.forEach(user => {
            if (!addressMap.get(user.user_id)) {
                user.address = []
            }
            else {
                const address = addressMap.get(user.user_id)
                user.address = address
            }
        })
        const userCount = allUsers.rows.length === 0 ? 0 : allUsers.rows[0].count
        const dataToSend = {
            totalUsers: userCount,
            data: allUsers.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

module.exports.getRestaurants = async (req, res, next) => {
    const { limit = 10, offset = 0, filter_col = 'name', filter_order = 'asc' } = req.query
    try {
        const subadminId = req.subadmin.subadminId
        const result = await query.getRestaurantsBySubadmin(subadminId, filter_col, filter_order, limit, offset)
        if (!result) {
            const err = new Error('An error occured while fetching restaurants')
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const restCount = result.rows.length === 0 ? 0 : result.rows[0].count
        const dataToSend = {
            totalRestaurants: restCount,
            data: result.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (e) {
        next(e)
    }
}

module.exports.getDishes = async (req, res, next) => {
    const { limit = 10, offset = 0, filter_col = 'name', filter_order = 'asc' } = req.query
    const { restId } = req.params
    try {
        const subadminId = req.subadmin.subadminId
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const result = await query.getDishesBySubadmin(subadminId, restId, filter_col, filter_order, limit, offset)
        if (!result) {
            const err = new Error('An error occured while fetching dishes')
            err.clientMessage = 'Cannot fetch dishes. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const dishCount = result.rows.length === 0 ? 0 : result.rows[0].count
        const dataToSend = {
            totalDishes: dishCount,
            data: result.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (e) {
        next(e)
    }
}