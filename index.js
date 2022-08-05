require('dotenv').config();
const express = require('express')
const app = express()

const user = require('./routes/user')
const admin = require('./routes/admin')
const subadmin = require('./routes/subadmin')

const error = require('./middlewares/errorHandling')

app.use(express.json())

app.use('/user', user)
app.use('/admin', admin)
app.use('/subadmin', subadmin)
app.use((req, res, next) => {
    const err = new Error(`Cannot GET ${req.path}`)
    err.statusCode = 404
    err.clientMessage = `Requested URL ${req.path} not found`
    next(err)
})

app.use(error.errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})