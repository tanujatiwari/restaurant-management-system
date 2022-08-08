"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const bcrypt = __importStar(require("bcrypt"));
const index_1 = __importDefault(require("../dbHelper/index"));
const models_1 = __importDefault(require("../models"));
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const getAdminCredentials = yield index_1.default.getAdminCredentials(email, 'admin');
        if (!getAdminCredentials) {
            const err = new Error('Can not find admin details');
            return next(err);
        }
        if (getAdminCredentials.rows.length === 0) {
            const err = new Error('Admin not found in database');
            err.clientMessage = `Please enter admin credentials`;
            err.statusCode = 400;
            return next(err);
        }
        const hashedPassword = getAdminCredentials.rows[0].password;
        if (yield bcrypt.compare(password, hashedPassword)) {
            const createSession = yield index_1.default.createNewSession(getAdminCredentials.rows[0].id);
            const userDetails = {
                sessionId: createSession.rows[0].session_id
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
const getAllSubadmins = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.params;
    try {
        const allSubAdmins = yield index_1.default.getAllSubadmins(filterCol, filterOrder, limit, (page - 1) * limit);
        if (!allSubAdmins) {
            const err = new Error('An error occured while fetching sub admins');
            err.clientMessage = 'Cannot fetch sub admins. Please try again later..';
            err.statusCode = 404;
            return next(err);
        }
        const subadminCount = allSubAdmins.rows.length === 0 ? 0 : allSubAdmins.rows[0].count;
        const dataToSend = {
            totalSubadmins: subadminCount,
            data: allSubAdmins.rows
        };
        res.status(200).json(dataToSend);
    }
    catch (err) {
        next(err);
    }
});
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query;
    try {
        const allUsers = yield index_1.default.getAllUsers(filterCol, filterOrder, limit, (page - 1) * limit);
        if (!allUsers) {
            const err = new Error('An error occured while fetching users');
            err.clientMessage = 'Cannot fetch users. Please try again later..';
            err.statusCode = 500;
            return next(err);
        }
        const users = allUsers.rows;
        const userIdArray = users.map(e => e.user_id);
        const allUsersAddresses = yield index_1.default.getAllAddresses(userIdArray);
        const addressMap = new Map();
        const userAddresses = allUsersAddresses.rows;
        userAddresses.forEach(item => {
            var _a;
            if (!addressMap.has(item.user_id)) {
                addressMap.set(item.user_id, [...item.address]);
            }
            else {
                (_a = addressMap.get(item.user_id)) === null || _a === void 0 ? void 0 : _a.push(...item.address);
            }
        });
        allUsers.rows.forEach(user => {
            if (!addressMap.get(user.user_id)) {
                user.address = [];
            }
            else {
                const address = addressMap.get(user.user_id);
                user.address = address;
            }
        });
        const userCount = allUsers.rows.length === 0 ? 0 : allUsers.rows[0].count;
        const dataToSend = {
            totalUsers: userCount,
            data: allUsers.rows
        };
        res.status(200).json(dataToSend);
    }
    catch (err) {
        next(err);
    }
});
const addMember = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { name, email, password, role } = req.body;
    const bcryptRounds = 10;
    const client = yield models_1.default.connect();
    try {
        const hashedPassword = yield bcrypt.hashSync(password, bcryptRounds);
        yield client.query('BEGIN');
        yield index_1.default.addUser(email, hashedPassword, name);
        const userId = yield index_1.default.getUserCredentials(email);
        const newUserId = userId.rows[0].id;
        const checkUserRole = yield index_1.default.checkUserRoleExists(newUserId, role);
        if (checkUserRole.rows.length !== 0) {
            const err = new Error(`User with ${role} role already exists!`);
            err.statusCode = 400;
            err.clientMessage = `User with ${role} role already exists!`;
            throw err;
        }
        yield index_1.default.addRole(newUserId, role, req.adminId);
        yield client.query('COMMIT');
        res.status(201).send('New user/role added');
    }
    catch (err) {
        yield client.query('ROLLBACK');
        client.release();
        next(err);
    }
    client.release();
});
const addRestaurant = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { name, lat, lon } = req.body;
    const geopoint = `${lon}, ${lat}`;
    try {
        const { adminId } = req;
        const checkRestaurantExists = yield index_1.default.checkRestaurantExists(name, geopoint);
        if (checkRestaurantExists.rows.length !== 0) {
            const err = new Error(`Restaurant already exists!`);
            err.statusCode = 400;
            err.clientMessage = `Restaurant already exists!`;
            return next(err);
        }
        yield index_1.default.addRest(name, geopoint, adminId);
        res.status(201).send('Restaurant added');
    }
    catch (e) {
        next(e);
    }
});
const addDish = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { name, description } = req.body;
    const { restId } = req.params;
    try {
        const { adminId } = req;
        const checkRestaurantIdValid = yield index_1.default.checkRestaurantIdValid(restId);
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`);
            err.statusCode = 400;
            err.clientMessage = `Could not find the restaurant`;
            return next(err);
        }
        const checkDishExists = yield index_1.default.checkDishExists(name, restId);
        if (checkDishExists.rows.length !== 0) {
            const err = new Error(`Dish at restaurant already exists!`);
            err.statusCode = 400;
            err.clientMessage = `Dish at restaurant already exists!`;
            return next(err);
        }
        yield index_1.default.addDish(name, description, adminId, restId);
        res.status(201).send('Dish added to your restaurant!');
    }
    catch (e) {
        next(e);
    }
});
const admin = {
    login,
    logout,
    addDish,
    addMember,
    addRestaurant,
    getAllSubadmins,
    getAllUsers
};
exports.default = admin;
