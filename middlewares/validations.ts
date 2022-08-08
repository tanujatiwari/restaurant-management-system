const Joi = require('joi')

interface Error {
    message: string;
    statusCode?: number;
    clientMessage?: string;
}

const validations = {
    validateAddress: async (req: any, res: any, next: any) => {
        const addressSchema = Joi.object({
            address: Joi.string().required().min(10),
            lat: Joi.number().required().min(-90).max(90),
            lon: Joi.number().required().min(-180).max(180)
        })
        const { error } = addressSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    },

    validateRegisterDetails: async (req: any, res: any, next: any) => {
        const registerSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.required(),
            name: Joi.string().min(3).max(30).required()
        })
        const { error } = registerSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    },

    validateLoginDetails: async (req: any, res: any, next: any) => {
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.required(),
        })
        const { error } = loginSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    },

    validateAddRestaurant: async (req: any, res: any, next: any) => {
        const addRestSchema = Joi.object({
            name: Joi.string().required(),
            lat: Joi.number().required().min(-90).max(90),
            lon: Joi.number().required().min(-180).max(180)
        })
        const { error } = addRestSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    },

    validateAddDish: async (req: any, res: any, next: any) => {
        const addDishSchema = Joi.object({
            name: Joi.string().min(5).max(30).required(),
            description: Joi.string().min(5).max(200).required()
        })
        const { error } = addDishSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    },

    validateAddMember: async (req: any, res: any, next: any) => {
        const registerSchema = Joi.object({
            email: Joi.string().email(),
            password: Joi.required(),
            name: Joi.string().min(3).max(30).required(),
            role: Joi.string().valid("subadmin", "user").required()
        })
        const { error } = registerSchema.validate(req.body)
        if (error) {
            const err: Error = new Error(error)
            err.statusCode = 400
            err.clientMessage = error.details[0].message
            return next(err)
        }
        next()
    }
}

export default validations