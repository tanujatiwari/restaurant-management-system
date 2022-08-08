import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
    statusCode?: number;
    clientMessage?: string;
}

const errorHandler = ((err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    const statusCode = err.statusCode || 500
    const defaultError = 'Something went wrong. Please try again later.'
    res.status(statusCode).json({
        messageToDev: err.message || defaultError,
        messageToClient: err.clientMessage || defaultError
    })
    next()
})

export default errorHandler