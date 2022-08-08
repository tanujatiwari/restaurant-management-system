interface Error {
    message: string;
    statusCode?: number;
    clientMessage?: string;
}

const errorHandler = ((err: Error, req: any, res: any, next: any) => {
    const statusCode = err.statusCode || 500
    const defaultError = 'Something went wrong. Please try again later.'
    res.status(statusCode).json({
        messageToDev: err.message || defaultError,
        messageToClient: err.clientMessage || defaultError
    })
})

export default errorHandler