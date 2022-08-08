import query from '../dbHelper/index'
import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
    statusCode?: number,
    clientMessage?: string
}

interface CustomRequest extends Request {
    subadminId: string,
    sessionId: string
}

async function authenticateSubadmin(request: Request, res: Response, next: NextFunction) {
    const req = request as CustomRequest
    const sessionId = req.headers.sessionid as string
    if (!sessionId) {
        const err: CustomError = new Error('Could not find Session Id in database')
        err.clientMessage = 'Please login or register first'
        err.statusCode = 400
        return next(err)
    }
    const checkValidSession = await query.checkValidSession(sessionId, 'subadmin')
    if (!checkValidSession) {
        const err: CustomError = new Error()
        return next(err)
    }
    if (checkValidSession.rows.length === 0) {
        const err: CustomError = new Error('Could not find session details in database')
        err.statusCode = 403
        err.clientMessage = 'This is an invalid session. Please login again...'
        return next(err)
    }

    req.sessionId = sessionId
    req.subadminId = checkValidSession.rows[0].user_id

    next()
}

export default authenticateSubadmin