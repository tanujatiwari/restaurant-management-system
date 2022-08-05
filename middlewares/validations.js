const Joi = require('joi')

module.exports.validateAddress = async (req, res, next) => {
    const addressSchema = Joi.object({
        address: Joi.string().required().min(10),
        lat: Joi.number().required().min(-90).max(90),
        lon: Joi.number().required().min(-180).max(180)
    })
    const { error } = addressSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}

module.exports.validateRegisterDetails = async (req, res, next) => {
    const registerSchema = Joi.object({
        email: Joi.string().email(),
        password: Joi.required(),
        name: Joi.string().min(3).max(30).required()
    })
    const { error } = registerSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}

module.exports.validateLoginDetails = async (req, res, next) => {
    const loginSchema = Joi.object({
        email: Joi.string().email(),
        password: Joi.required(),
    })
    const { error } = loginSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}

module.exports.validateAddRestaurant = async (req, res, next) => {
    const addRestSchema = Joi.object({
        name: Joi.string().required(),
        lat: Joi.number().required().min(-90).max(90),
        lon: Joi.number().required().min(-180).max(180)
    })
    const { error } = addRestSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}

module.exports.validateAddDish = async (req, res, next) => {
    const addDishSchema = Joi.object({
        name: Joi.string().min(5).max(30).required(),
        description: Joi.string().min(5).max(200).required()
    })
    const { error } = addDishSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}

module.exports.validateAddMember = async (req, res, next) => {
    const registerSchema = Joi.object({
        email: Joi.string().email(),
        password: Joi.required(),
        name: Joi.string().min(3).max(30).required(),
        role: Joi.string().valid("subadmin", "user").required()
    })
    const { error } = registerSchema.validate(req.body)
    if (error) {
        const err = new Error(error)
        err.statusCode = 400
        err.clientMessage = error.details[0].message
        return next(err)
    }
    next()
}