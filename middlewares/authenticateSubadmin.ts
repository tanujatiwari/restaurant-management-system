import query from '../dbHelper/index'

interface Error {
    message: string,
    statusCode?: number,
    clientMessage?: string
}

async function authenticateSubadmin(req: any, res: any, next: any) {
    const sessionId = req.headers.sessionid
    if (!sessionId) {
        const err: Error = new Error('Could not find Session Id in database')
        err.clientMessage = 'Please login or register first'
        err.statusCode = 400
        return next(err)
    }
    const checkValidSession = await query.checkValidSession(sessionId, 'subadmin')
    if (!checkValidSession) {
        const err = new Error()
        return next(err)
    }
    if (checkValidSession.rows.length === 0) {
        const err: Error = new Error('Could not find session details in database')
        err.statusCode = 403
        err.clientMessage = 'This is an invalid session. Please login again...'
        return next(err)
    }
    req.subadmin = {
        subadminId: checkValidSession.rows[0].user_id,
        sessionId: sessionId
    }
    next()
}

export default authenticateSubadmin