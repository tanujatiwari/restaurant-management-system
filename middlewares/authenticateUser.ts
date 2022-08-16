import query from '../dbHelper/index'
import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error{
    clientMessage?: string,
    statusCode?: number
}

interface CustomRequest extends Request {
    userId: string,
    sessionId: string
}

async function authenticateUser(request: Request, res: Response, next: NextFunction) {
    const req = request as CustomRequest
    const sessionId = req.headers.sessionid as string

    if (!sessionId) {
        const err: CustomError = new Error('Could not find Session ID in database')
        err.clientMessage = 'Please login or register first'
        err.statusCode = 400
        return next(err)
    }

    const checkValidSession = await query.checkValidSession(sessionId, 'user')
    if (!checkValidSession) {
        const err:CustomError = new Error()
        return next(err)
    }

    if (checkValidSession.rows.length === 0) {
        const err: CustomError = new Error('Could not find session details in database')
        err.statusCode = 403
        err.clientMessage = 'This is an invalid session. Please login again...'
        return next(err)
    }
    
    req.userId = checkValidSession.rows[0].user_id
    req.sessionId = sessionId
    
    next()
}

export default authenticateUser