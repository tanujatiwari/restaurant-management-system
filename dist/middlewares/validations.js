"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const validations = {
    validateAddress: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const addressSchema = joi_1.default.object({
            address: joi_1.default.string().required().min(10),
            lat: joi_1.default.number().required().min(-90).max(90),
            lon: joi_1.default.number().required().min(-180).max(180)
        });
        const { error } = addressSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    }),
    validateRegisterDetails: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const registerSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.required(),
            name: joi_1.default.string().min(3).max(30).required()
        });
        const { error } = registerSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    }),
    validateLoginDetails: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const loginSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.required(),
        });
        const { error } = loginSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    }),
    validateAddRestaurant: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const addRestSchema = joi_1.default.object({
            name: joi_1.default.string().required(),
            lat: joi_1.default.number().required().min(-90).max(90),
            lon: joi_1.default.number().required().min(-180).max(180)
        });
        const { error } = addRestSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    }),
    validateAddDish: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const addDishSchema = joi_1.default.object({
            name: joi_1.default.string().min(5).max(30).required(),
            description: joi_1.default.string().min(5).max(200).required()
        });
        const { error } = addDishSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    }),
    validateAddMember: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const registerSchema = joi_1.default.object({
            email: joi_1.default.string().email(),
            password: joi_1.default.required(),
            name: joi_1.default.string().min(3).max(30).required(),
            role: joi_1.default.string().valid("subadmin", "user").required()
        });
        const { error } = registerSchema.validate(req.body);
        if (error) {
            const err = new Error(error.message);
            err.statusCode = 400;
            err.clientMessage = error.message;
            return next(err);
        }
        next();
    })
};
exports.default = validations;
