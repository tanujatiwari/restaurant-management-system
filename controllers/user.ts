import bcrypt from 'bcrypt'
import query from '../dbHelper/index'
import pool from '../models/index'

import express from 'express';
const app = express()

import path from 'path';

import { Request, Response, NextFunction } from 'express'

import admin from "firebase-admin"

const firebaseAccountCredentials = require('../serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(firebaseAccountCredentials),
    storageBucket: process.env.FIREBASE_BUCKET,
});

app.locals.bucket = admin.storage().bucket()

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
    userId: string,
    sessionId: string
}

const restaurants = async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10, page = 1, filterCol = 'ratings', filterOrder = 'asc' } = req.query as unknown as ReqQuery

    try {
        const restaurants = await query.getAllRestaurants(limit, (page - 1) * limit, filterCol, filterOrder)
        if (!restaurants) {
            const err: CustomError = new Error('An error occured while fetching restaurants')
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..'
            err.statusCode = 404
            return next(err)
        }
        const restaurantCount: number = restaurants.rows.length === 0 ? 0 : restaurants.rows[0].count
        const dataToSend = {
            totalRestaurants: restaurantCount,
            data: restaurants.rows
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

const dishes = async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query as unknown as ReqQuery
    const { restId } = req.params as { restId: string };
    try {
        const checkRestaurantIdValid = await query.checkRestaurantIdValid(restId)
        if (checkRestaurantIdValid.rows.length === 0) {
            const err: CustomError = new Error(`Invalid Restaurant Id in params`)
            err.statusCode = 400
            err.clientMessage = `Could not find the restaurant`
            return next(err)
        }
        const dishes = await query.getAllDishes(limit, (page - 1) * limit, filterCol, filterOrder, restId)
        if (!dishes) {
            const err: CustomError = new Error(`An error occured while fetching dishes.`)
            err.clientMessage = 'Cannot fetch dishes. Please try again later...'
            err.statusCode = 404
            return next(err)
        }
        const dishCount: number = dishes.rows.length === 0 ? 0 : dishes.rows[0].count
        const dataToSend = {
            totalDishes: dishCount,
            data: dishes.rows,
        }
        res.status(200).json(dataToSend)
    }
    catch (err) {
        next(err)
    }
}

const addAddress = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    try {
        const { address, lat, lon }: { address: string, lat: string, lon: string } = req.body
        const geopoint: string = `${lon}, ${lat}`
        const addressCheck = await query.checkAddressExists(req.userId, geopoint)
        if (addressCheck.rows.length !== 0) {
            const err: CustomError = new Error(`Address already exists!`)
            err.clientMessage = `Address already exists!`
            err.statusCode = 409
            return next(err)
        }
        await query.addUserAddress(req.userId, address, geopoint)
        return res.status(201).send('Address added successfully')
    }
    catch (err) {
        next(err)
    }
}

const register = (async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body as { email: string, password: string, name: string }
    const bcryptRounds = 10
    const client = await pool.connect()
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptRounds)
        await client.query('BEGIN')
        const result = await query.addNewUser(email, hashedPassword, name)
        const newUserId: string = result.rows[0].id
        await query.addRole(newUserId, 'user', newUserId)
        const newSessionId = await query.createNewSession(newUserId)
        await client.query('COMMIT')
        const userDetails = {
            sessionId: newSessionId.rows[0].session_id as string
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

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as { email: string, password: string }
    try {
        const getUserIdPassword = await query.getUserCredentials(email)
        if (!getUserIdPassword) {
            const err: CustomError = new Error('Can not fetch user details')
            return next(err)
        }
        if (getUserIdPassword.rows.length === 0) {
            const err: CustomError = new Error('User not found in database')
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
                sessionId: newSessionId.rows[0].session_id as string
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

const uploadPhoto = async (request: Request, res: Response, next: NextFunction) => {
    const req = request as CustomRequest
    try {
        const file = req.file
        const fileType = req.file?.originalname.split('.')[1]
        if (fileType === 'jpg' || fileType ==='jpeg' || fileType==='png') {
            const userId = req.userId
            const name = file?.originalname as string
            const fileName = userId + name + path.extname(name)
            await app.locals.bucket.file(fileName).createWriteStream().end(file?.buffer)
            res.status(200).send('File uploaded successfully!')
        }
        else {
            const err: CustomError = new Error(`Uploaded file is of type ${fileType}. Must be an image`)
            err.statusCode = 401
            err.clientMessage = 'The file should be .jpg .jpeg .png'
            return next(err)
        }
    }
    catch (err) {
        next(err)
    }
}

const user = {
    register,
    login,
    logout,
    restaurants,
    dishes,
    addAddress,
    uploadPhoto
}

export default user