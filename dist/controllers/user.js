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
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_1 = __importDefault(require("../dbHelper/index"));
const index_2 = __importDefault(require("../models/index"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const path_1 = __importDefault(require("path"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebaseAccountCredentials = require('../serviceAccountKey.json');
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(firebaseAccountCredentials),
    storageBucket: process.env.FIREBASE_BUCKET,
});
app.locals.bucket = firebase_admin_1.default.storage().bucket();
const restaurants = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = 10, page = 1, filterCol = 'ratings', filterOrder = 'asc' } = req.query;
    try {
        const restaurants = yield index_1.default.getAllRestaurants(limit, (page - 1) * limit, filterCol, filterOrder);
        if (!restaurants) {
            const err = new Error('An error occured while fetching restaurants');
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..';
            err.statusCode = 404;
            return next(err);
        }
        const restaurantCount = restaurants.rows.length === 0 ? 0 : restaurants.rows[0].count;
        const dataToSend = {
            totalRestaurants: restaurantCount,
            data: restaurants.rows
        };
        res.status(200).json(dataToSend);
    }
    catch (err) {
        next(err);
    }
});
const dishes = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query;
    const { restId } = req.params;
    try {
        const checkRestaurantIdValid = yield index_1.default.checkRestaurantIdValid(restId);
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`);
            err.statusCode = 400;
            err.clientMessage = `Could not find the restaurant`;
            return next(err);
        }
        const dishes = yield index_1.default.getAllDishes(limit, (page - 1) * limit, filterCol, filterOrder, restId);
        if (!dishes) {
            const err = new Error(`An error occured while fetching dishes.`);
            err.clientMessage = 'Cannot fetch dishes. Please try again later...';
            err.statusCode = 404;
            return next(err);
        }
        const dishCount = dishes.rows.length === 0 ? 0 : dishes.rows[0].count;
        const dataToSend = {
            totalDishes: dishCount,
            data: dishes.rows,
        };
        res.status(200).json(dataToSend);
    }
    catch (err) {
        next(err);
    }
});
const addAddress = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    try {
        const { address, lat, lon } = req.body;
        const geopoint = `${lon}, ${lat}`;
        const addressCheck = yield index_1.default.checkAddressExists(req.userId, geopoint);
        if (addressCheck.rows.length !== 0) {
            const err = new Error(`Address already exists!`);
            err.clientMessage = `Address already exists!`;
            err.statusCode = 409;
            return next(err);
        }
        yield index_1.default.addUserAddress(req.userId, address, geopoint);
        return res.status(201).send('Address added successfully');
    }
    catch (err) {
        next(err);
    }
});
const register = ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    const bcryptRounds = 10;
    const client = yield index_2.default.connect();
    try {
        const hashedPassword = yield bcrypt_1.default.hashSync(password, bcryptRounds);
        yield client.query('BEGIN');
        const result = yield index_1.default.addNewUser(email, hashedPassword, name);
        const newUserId = result.rows[0].id;
        yield index_1.default.addRole(newUserId, 'user', newUserId);
        const newSessionId = yield index_1.default.createNewSession(newUserId);
        yield client.query('COMMIT');
        const userDetails = {
            sessionId: newSessionId.rows[0].session_id
        };
        res.status(201).json(userDetails);
    }
    catch (err) {
        yield client.query('ROLLBACK');
        client.release();
        next(err);
    }
    client.release();
}));
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const getUserIdPassword = yield index_1.default.getUserCredentials(email);
        if (!getUserIdPassword) {
            const err = new Error('Can not fetch user details');
            return next(err);
        }
        if (getUserIdPassword.rows.length === 0) {
            const err = new Error('User not found in database');
            err.clientMessage = `Please register first`;
            err.statusCode = 400;
            return next(err);
        }
        if (yield bcrypt_1.default.compare(password, getUserIdPassword.rows[0].password)) {
            const newSessionId = yield index_1.default.createNewSession(getUserIdPassword.rows[0].id);
            if (!newSessionId) {
                const err = new Error('Could not create user session');
                return next(err);
            }
            const userDetails = {
                sessionId: newSessionId.rows[0].session_id
            };
            return res.status(200).json(userDetails);
        }
        else {
            const err = new Error('Email and password does not match');
            err.statusCode = 401;
            err.clientMessage = 'Email and password does not match';
            return next(err);
        }
    }
    catch (err) {
        next(err);
    }
});
const logout = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    try {
        const { sessionId } = req;
        const curr_date = new Date();
        yield index_1.default.logout(curr_date.toISOString(), sessionId);
        return res.status(200).send('Successfully logged out');
    }
    catch (err) {
        next(err);
    }
});
const uploadPhoto = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const req = request;
    try {
        const file = req.file;
        const fileType = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname.split('.')[1];
        if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
            const userId = req.userId;
            const name = file === null || file === void 0 ? void 0 : file.originalname;
            const fileName = userId + name + path_1.default.extname(name);
            yield app.locals.bucket.file(fileName).createWriteStream().end(file === null || file === void 0 ? void 0 : file.buffer);
            res.status(200).send('File uploaded successfully!');
        }
        else {
            const err = new Error(`Uploaded file is of type ${fileType}. Must be an image`);
            err.statusCode = 401;
            err.clientMessage = 'The file should be .jpg .jpeg .png';
            return next(err);
        }
    }
    catch (err) {
        next(err);
    }
});
const user = {
    register,
    login,
    logout,
    restaurants,
    dishes,
    addAddress,
    uploadPhoto
};
exports.default = user;
