import * as bcrypt from "bcrypt"
import query from '../dbHelper/index'
import pool from '../models'
import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
    clientMessage?: string,
    statusCode?: number
}

interface CustomRequest extends Request {
    adminId: string,
    sessionId: string
}

interface ReqParams {
    limit: number,
    page: number,
    filterCol: string,
    filterOrder: string
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
        const { email, password } = req.body as { email: string, password: string }
        const getAdminCredentials = await query.getAdminCredentials(email, 'admin')
        if (!getAdminCredentials) {
            const err: CustomError = new Error('Can not find admin details')
            return next(err)
        }
        if (getAdminCredentials.rows.length === 0) {
            const err: CustomError = new Error('Admin not found in database')
            err.clientMessage = `Please enter admin credentials`
            err.statusCode = 400
            return next(err)
        }
        const hashedPassword: string = getAdminCredentials.rows[0].password
        if (await bcrypt.compare(password, hashedPassword)) {
            const createSession = await query.createNewSession(getAdminCredentials.rows[0].id)
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

const getAllSubadmins = async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.params as unknown as ReqParams
    try {
        const allSubAdmins = await query.getAllSubadmins(filterCol, filterOrder, limit, (page - 1) * limit)
        if (!allSubAdmins) {
            const err: CustomError = new Error('An error occured while fetching sub admins')
            err.clientMessage = 'Cannot fetch sub admins. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const subadminCount: number = allSubAdmins.rows.length === 0 ? 0 : allSubAdmins.rows[0].count
        const dataToSend = {
            totalSubadmins: subadminCount,
            data: allSubAdmins.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query as unknown as ReqParams
    try {
        const allUsers = await query.getAllUsers(filterCol, filterOrder, limit, (page - 1) * limit)
        if (!allUsers) {
            const err: CustomError = new Error('An error occured while fetching users')
            err.clientMessage = 'Cannot fetch users. Please try again later..'
            err.statusCode = 500
            return next(err)
        }
        const users: User[] = allUsers.rows;

        const userIdArray = users.map(e => e.user_id)
        const allUsersAddresses = await query.getAllAddresses(userIdArray);
        
        const addressMap = new Map<string, string[]>()
        const userAddresses: UserAddress[] = allUsersAddresses.rows
        userAddresses.forEach(item => {
            if (!addressMap.has(item.user_id)) {
                addressMap.set(item.user_id, [...item.address])
            }
            else {
                addressMap.get(item.user_id)?.push(...item.address)
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

const addMember = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { name, email, password, role } = req.body as { name: string, email: string, password: string, role: string }
    const bcryptRounds = 10;
    const client = await pool.connect()
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptRounds);
        await client.query('BEGIN')
        await query.addUser(email, hashedPassword, name)
        const userId = await query.getUserCredentials(email)
        const newUserId = userId.rows[0].id as string;
        const checkUserRole = await query.checkUserRoleExists(newUserId, role)
        if (checkUserRole.rows.length !== 0) {
            const err: CustomError = new Error(`User with ${role} role already exists!`)
            err.statusCode = 400
            err.clientMessage = `User with ${role} role already exists!`
            throw err
        }
        await query.addRole(newUserId, role, req.adminId)
        await client.query('COMMIT')
        res.status(201).send('New user/role added')
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
    const { name, lat, lon } = req.body as unknown as { name: string, lat: number, lon: number }
    const geopoint = `${lon}, ${lat}`;
    try {
        const { adminId } = req
        const checkRestaurantExists = await query.checkRestaurantExists(name, geopoint);
        if (checkRestaurantExists.rows.length !== 0) {
            const err: CustomError = new Error(`Restaurant already exists!`)
            err.statusCode = 400
            err.clientMessage = `Restaurant already exists!`
            return next(err)
        }
        await query.addRest(name, geopoint, adminId)
        res.status(201).send('Restaurant added')
    }
    catch (e) {
        next(e)
    }
}

const addDish = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    const { name, description } = req.body as { name: string, description: string }
    const { restId } = req.params as { restId: string }
    try {
        const { adminId } = req
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
        await query.addDish(name, description, adminId, restId)
        res.status(201).send('Dish added to your restaurant!')
    }
    catch (e) {
        next(e)
    }
}

const admin = {
    login,
    logout,
    addDish,
    addMember,
    addRestaurant,
    getAllSubadmins,
    getAllUsers
}

export default admin