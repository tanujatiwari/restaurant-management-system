import 'dotenv/config'
import express = require('express');
const app = express()

app.use(express.json())
import user from './routes/user'
import admin from './routes/admin'
import subadmin from './routes/subadmin'
import errorHandler from './middlewares/errorHandling'

app.use('/user', user)
app.use('/admin', admin)
app.use('/subadmin', subadmin)

interface CustomError extends Error {
    statusCode?: number;
    clientMessage?: string;
}

app.use((req, res, next) => {
    const err: CustomError = new Error(`Cannot GET ${req.path}`)
    err.statusCode = 404
    err.clientMessage = `Requested URL ${req.path} not found`
    next(err)
})

app.use(errorHandler)

const port = (process.env.PORT || 3000) as number
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})