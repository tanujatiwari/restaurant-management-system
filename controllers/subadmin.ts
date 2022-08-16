import bcrypt from 'bcrypt';
import query from '../dbHelper/index'
import pool from '../models/index'
import { Request, Response, NextFunction } from 'express'

import storage from '../firebase/index'

interface CustomError extends Error {
    statusCode?: number;
    clientMessage?: string;
}

interface ReqQuery {
    limit: number,
    page: number,
    filterCol: string,
    filterOrder: string
}

interface CustomRequest extends Request {
    sessionId: string,
    subadminId: string
}

interface User {
    user_id: string,
    email: string,
    name: string,
    is_archived: boolean,
    count: number,
    role: string,
    created_by: string,
    address?: string[]
}

interface UserAddress extends User {
    address: string[]
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as { email: string, password: string };
        const getSubadminCredentials = await query.getAdminCredentials(email, 'subadmin')
        if (!getSubadminCredentials) {
            const err: CustomError = new Error('Can not find subadmin details')
            return next(err)
        }
        if (getSubadminCredentials.rows.length === 0) {
            const err: CustomError = new Error('Subadmin not found in database')
            err.clientMessage = `Please enter correct subadmin credentials`
            err.statusCode = 400
            return next(err)
        }
        const hashedPassword = getSubadminCredentials.rows[0].password as string
        if (await bcrypt.compare(password, hashedPassword)) {
            const createSession = await query.createNewSession(getSubadminCredentials.rows[0].id)
            const userDetails = {
                sessionId: createSession.rows[0].session_id as string
            }
            return res.status(200).json(userDetails)
        }
        else {
            const err: CustomError = new Error('Email and password does not match')
            err.statusCode = 401
            err.clientMessage = 'Email and password does not match'
            return next(err)
        }
    }
    catch (err) {
        next(err)
    }
}

const logout = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    try {
        const { sessionId } = req;
        const curr_date = new Date()
        await query.logout(curr_date.toISOString(), sessionId)
        return res.status(200).send('Successfully logged out')
    }
    catch (err) {
        next(err)
    }
}

const addUser = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { name, email, password } = req.body as { name: string, email: string, password: string };
    const { subadminId } = req
    const bcryptRounds = 10;
    const client = await pool.connect()
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptRounds);
        await client.query('BEGIN')
        await query.addUser(email, hashedPassword, name)
        const userId = await query.getUserCredentials(email)
        const newUserId = userId.rows[0].id as string
        const checkUserRole = await query.checkUserRoleExists(newUserId, 'user')
        if (checkUserRole.rows.length !== 0) {
            const err: CustomError = new Error(`User with user role already exists!`)
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

const addRestaurant = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const file = req.file
    const { name, lat, lon } = req.body as unknown as { name: string, lat: number, lon: number };
    const geopoint = `${lon}, ${lat}`;
    const fileType = file?.originalname.split('.')[1]
    if (fileType !== 'jpg' && fileType !== 'jpeg' && fileType !== 'png') {
        const err: CustomError = new Error(`Uploaded file is of type ${fileType}. Must be an image`)
        err.statusCode = 401
        err.clientMessage = 'The file should be .jpg .jpeg .png'
        return next(err)
    }
    const client = await pool.connect()
    try {
        const { subadminId } = req
        const checkRestaurantExists = await query.checkRestaurantExists(name, geopoint);
        if (checkRestaurantExists.rows.length !== 0) {
            const err: CustomError = new Error(`Restaurant already exists!`)
            err.statusCode = 400
            err.clientMessage = `Restaurant already exists!`
            return next(err)
        }
        await client.query('BEGIN')
        const restId = await query.addRest(name, geopoint, subadminId)
        const path = 'restaurants/' + restId.rows[0].id + '/venue/'
        const fileName = file?.originalname.split('.')[0] + '-' + Date.now() + `.${fileType}`
        const firebaseFileName = path + fileName
        storage.file(firebaseFileName).createWriteStream().end(file?.buffer)
        const newRestImage = await query.addImage(fileName, path, 'restaurant');
        await query.addRestImageDetails(restId.rows[0].id, newRestImage.rows[0].id)
        await client.query('COMMIT')
        res.status(201).send('Restaurant added')

    }
    catch (err) {
        client.query('ROLLBACK')
        client.release()
        next(err)
    }
}

const addDish = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const file = req.file
    const { name, description } = req.body as { name: string, description: string };
    const { restId } = req.params as { restId: string }
    const fileType = file?.originalname.split('.')[1]
    if (fileType !== 'jpg' && fileType !== 'jpeg' && fileType !== 'png') {
        const err: CustomError = new Error(`Uploaded file is of type ${fileType}. Must be an image`)
        err.statusCode = 401
        err.clientMessage = 'The file should be .jpg .jpeg .png'
        return next(err)
    }
    const client = await pool.connect()
    try {
        const { subadminId } = req
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err: CustomError = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const checkDishExists = await query.checkDishExists(name, restId);
        if (checkDishExists.rows.length !== 0) {
            const err: CustomError = new Error(`Dish at restaurant already exists!`)
            err.statusCode = 400
            err.clientMessage = `Dish at restaurant already exists!`
            return next(err)
        }
        const checkRestaurantOwner = await query.checkRestaurantOwner(subadminId, restId)
        if (checkRestaurantOwner.rows.length === 0) {
            const err: CustomError = new Error(`This restaurant was not created by the subadmin`)
            err.statusCode = 400
            err.clientMessage = `You cannot add dish in the restaurant you have not created`
            return next(err)
        }
        await client.query('BEGIN')
        const dishId = await query.addDish(name, description, subadminId, restId)
        const path = 'restaurants/' + restId + '/dishes/'
        const fileName = file?.originalname.split('.')[0] + '-' + Date.now() + `.${fileType}`
        const firebaseFileName = path + fileName
        await storage.file(firebaseFileName).createWriteStream().end(file?.buffer)
        const newDishImage = await query.addImage(fileName, path, 'dish');
        await query.addDishImageDetails(dishId.rows[0].id, newDishImage.rows[0].id)
        await client.query('COMMIT')
        res.status(201).send('Dish added to your restaurant!')

    }
    catch (err) {
        await client.query('ROLLBACK')
        client.release()
        next(err)
    }
}

const getUsers = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query as unknown as ReqQuery
    try {
        const { subadminId } = req
        const allUsers = await query.getUsersBySubadmin(subadminId, filterCol, filterOrder, limit, (page - 1) * limit)
        if (!allUsers) {
            const err: CustomError = new Error('An error occured while fetching users')
            err.clientMessage = 'Cannot fetch users. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const users: User[] = allUsers.rows
        const userIdArray: string[] = users.map(e => e.user_id)

        const addressMap = new Map<string, string[]>()

        const allUsersAddresses = await query.getAllAddresses(userIdArray);
        const userAddresses: UserAddress[] = allUsersAddresses.rows

        userAddresses.forEach(item => {
            if (!addressMap.has(item.user_id)) {
                addressMap.set(item.user_id, [...item.address])
            }
            else {
                addressMap.get(item.user_id)?.push(...item.address)
            }
        })
        users.forEach(user => {
            if (!addressMap.get(user.user_id)) {
                user.address = []
            }
            else {
                const address = addressMap.get(user.user_id)
                user.address = address
            }
        })
        const userCount: number = allUsers.rows.length === 0 ? 0 : allUsers.rows[0].count
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

const getRestaurants = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query as unknown as ReqQuery
    try {
        const { subadminId } = req
        const result = await query.getRestaurantsBySubadmin(subadminId, filterCol, filterOrder, limit, (page - 1) * limit)
        if (!result) {
            const err: CustomError = new Error('An error occured while fetching restaurants')
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const restCount: number = result.rows.length === 0 ? 0 : result.rows[0].count
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

const getDishes = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query as unknown as ReqQuery
    const { restId } = req.params as { restId: string }
    try {
        const { subadminId } = req
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err: CustomError = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const result = await query.getDishesBySubadmin(subadminId, restId, filterCol, filterOrder, limit, (page - 1) * limit)
        if (!result) {
            const err: CustomError = new Error('An error occured while fetching dishes')
            err.clientMessage = 'Cannot fetch dishes. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const dishCount: number = result.rows.length === 0 ? 0 : result.rows[0].count
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

const uploadImage = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { restId, dishId } = req.body as { restId: string, dishId: string }
    const client = await pool.connect()
    try {
        const file = req.file
        const fileType = file?.originalname.split('.')[1]
        if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
            if (!dishId) {
                //only uploading venue photos
                const path = 'restaurants/' + restId + '/venue/'
                const fileName = file?.originalname.split('.')[0] + '-' + Date.now() + `.${fileType}`
                const firebaseFileName = path + fileName
                await client.query('BEGIN')
                await storage.file(firebaseFileName).createWriteStream().end(file?.buffer)
                const newRestImage = await query.addImage(fileName, path, 'restaurant');
                await query.addRestImageDetails(restId, newRestImage.rows[0].id)
                await client.query('COMMIT')
                res.status(200).send('File uploaded successfully!')
            }
            else {
                //only uploading dish photos
                const path = 'restaurants/' + restId + '/dishes/'
                const fileName = file?.originalname.split('.')[0] + '-' + Date.now() + `.${fileType}`
                const firebaseFileName = path + fileName
                await client.query('BEGIN')
                await storage.file(firebaseFileName).createWriteStream().end(file?.buffer)
                const newDishImage = await query.addImage(fileName, path, 'dish');
                await query.addDishImageDetails(dishId, newDishImage.rows[0].id)
                await client.query('COMMIT')
                res.status(200).send('File uploaded successfully!')
            }
        }
        else {
            const err: CustomError = new Error(`Uploaded file is of type ${fileType}. Must be an image`)
            err.statusCode = 401
            err.clientMessage = 'The file should be .jpg .jpeg .png'
            return next(err)
        }
    }
    catch (err) {
        await client.query('ROLLBACK')
        client.release()
        next(err)
    }
}



const subadmin = {
    login,
    logout,
    addUser,
    addRestaurant,
    addDish,
    getDishes,
    getRestaurants,
    getUsers,
    uploadImage
}

export default subadmin