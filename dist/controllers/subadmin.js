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
const index_3 = __importDefault(require("../firebase/index"));
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const getSubadminCredentials = yield index_1.default.getAdminCredentials(email, 'subadmin');
        if (!getSubadminCredentials) {
            const err = new Error('Can not find subadmin details');
            return next(err);
        }
        if (getSubadminCredentials.rows.length === 0) {
            const err = new Error('Subadmin not found in database');
            err.clientMessage = `Please enter correct subadmin credentials`;
            err.statusCode = 400;
            return next(err);
        }
        const hashedPassword = getSubadminCredentials.rows[0].password;
        if (yield bcrypt_1.default.compare(password, hashedPassword)) {
            const createSession = yield index_1.default.createNewSession(getSubadminCredentials.rows[0].id);
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
const addUser = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { name, email, password } = req.body;
    const { subadminId } = req;
    const bcryptRounds = 10;
    const client = yield index_2.default.connect();
    try {
        const hashedPassword = bcrypt_1.default.hashSync(password, bcryptRounds);
        yield client.query('BEGIN');
        yield index_1.default.addUser(email, hashedPassword, name);
        const userId = yield index_1.default.getUserCredentials(email);
        const newUserId = userId.rows[0].id;
        const checkUserRole = yield index_1.default.checkUserRoleExists(newUserId, 'user');
        if (checkUserRole.rows.length !== 0) {
            const err = new Error(`User with user role already exists!`);
            err.statusCode = 400;
            err.clientMessage = `User with user role already exists!`;
            throw err;
        }
        yield index_1.default.addRole(newUserId, 'user', subadminId);
        yield client.query('COMMIT');
        res.status(201).send('User added');
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
    const file = req.file;
    const { name, lat, lon } = req.body;
    const geopoint = `${lon}, ${lat}`;
    const fileType = file === null || file === void 0 ? void 0 : file.originalname.split('.')[1];
    if (fileType !== 'jpg' && fileType !== 'jpeg' && fileType !== 'png') {
        const err = new Error(`Uploaded file is of type ${fileType}. Must be an image`);
        err.statusCode = 401;
        err.clientMessage = 'The file should be .jpg .jpeg .png';
        return next(err);
    }
    const client = yield index_2.default.connect();
    try {
        const { subadminId } = req;
        const checkRestaurantExists = yield index_1.default.checkRestaurantExists(name, geopoint);
        if (checkRestaurantExists.rows.length !== 0) {
            const err = new Error(`Restaurant already exists!`);
            err.statusCode = 400;
            err.clientMessage = `Restaurant already exists!`;
            return next(err);
        }
        yield client.query('BEGIN');
        const restId = yield index_1.default.addRest(name, geopoint, subadminId);
        const path = 'restaurants/' + restId.rows[0].id + '/venue/';
        const fileName = (file === null || file === void 0 ? void 0 : file.originalname.split('.')[0]) + '-' + Date.now() + `.${fileType}`;
        const firebaseFileName = path + fileName;
        index_3.default.file(firebaseFileName).createWriteStream().end(file === null || file === void 0 ? void 0 : file.buffer);
        const newRestImage = yield index_1.default.addImage(fileName, path, 'restaurant');
        yield index_1.default.addRestImageDetails(restId.rows[0].id, newRestImage.rows[0].id);
        yield client.query('COMMIT');
        res.status(201).send('Restaurant added');
    }
    catch (err) {
        client.query('ROLLBACK');
        client.release();
        next(err);
    }
});
const addDish = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const file = req.file;
    const { name, description } = req.body;
    const { restId } = req.params;
    const fileType = file === null || file === void 0 ? void 0 : file.originalname.split('.')[1];
    if (fileType !== 'jpg' && fileType !== 'jpeg' && fileType !== 'png') {
        const err = new Error(`Uploaded file is of type ${fileType}. Must be an image`);
        err.statusCode = 401;
        err.clientMessage = 'The file should be .jpg .jpeg .png';
        return next(err);
    }
    const client = yield index_2.default.connect();
    try {
        const { subadminId } = req;
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
        const checkRestaurantOwner = yield index_1.default.checkRestaurantOwner(subadminId, restId);
        if (checkRestaurantOwner.rows.length === 0) {
            const err = new Error(`This restaurant was not created by the subadmin`);
            err.statusCode = 400;
            err.clientMessage = `You cannot add dish in the restaurant you have not created`;
            return next(err);
        }
        yield client.query('BEGIN');
        const dishId = yield index_1.default.addDish(name, description, subadminId, restId);
        const path = 'restaurants/' + restId + '/dishes/';
        const fileName = (file === null || file === void 0 ? void 0 : file.originalname.split('.')[0]) + '-' + Date.now() + `.${fileType}`;
        const firebaseFileName = path + fileName;
        yield index_3.default.file(firebaseFileName).createWriteStream().end(file === null || file === void 0 ? void 0 : file.buffer);
        const newDishImage = yield index_1.default.addImage(fileName, path, 'dish');
        yield index_1.default.addDishImageDetails(dishId.rows[0].id, newDishImage.rows[0].id);
        yield client.query('COMMIT');
        res.status(201).send('Dish added to your restaurant!');
    }
    catch (err) {
        yield client.query('ROLLBACK');
        client.release();
        next(err);
    }
});
const getUsers = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query;
    try {
        const { subadminId } = req;
        const allUsers = yield index_1.default.getUsersBySubadmin(subadminId, filterCol, filterOrder, limit, (page - 1) * limit);
        if (!allUsers) {
            const err = new Error('An error occured while fetching users');
            err.clientMessage = 'Cannot fetch users. Please try again later..';
            err.statusCode = 404;
            return next(err);
        }
        const users = allUsers.rows;
        const userIdArray = users.map(e => e.user_id);
        const addressMap = new Map();
        const allUsersAddresses = yield index_1.default.getAllAddresses(userIdArray);
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
        users.forEach(user => {
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
const getRestaurants = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query;
    try {
        const { subadminId } = req;
        const result = yield index_1.default.getRestaurantsBySubadmin(subadminId, filterCol, filterOrder, limit, (page - 1) * limit);
        if (!result) {
            const err = new Error('An error occured while fetching restaurants');
            err.clientMessage = 'Cannot fetch restaurants. Please try again later..';
            err.statusCode = 404;
            return next(err);
        }
        const restCount = result.rows.length === 0 ? 0 : result.rows[0].count;
        const dataToSend = {
            totalRestaurants: restCount,
            data: result.rows
        };
        res.status(200).json(dataToSend);
    }
    catch (e) {
        next(e);
    }
});
const getDishes = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { limit = 10, page = 1, filterCol = 'name', filterOrder = 'asc' } = req.query;
    const { restId } = req.params;
    try {
        const { subadminId } = req;
        const checkRestaurantIdValid = yield index_1.default.checkRestaurantIdValid(restId);
        if (checkRestaurantIdValid.rows.length === 0) {
            const err = new Error(`Invalid Restaurant Id in params`);
            err.statusCode = 400;
            err.clientMessage = `Could not find the restaurant`;
            return next(err);
        }
        const result = yield index_1.default.getDishesBySubadmin(subadminId, restId, filterCol, filterOrder, limit, (page - 1) * limit);
        if (!result) {
            const err = new Error('An error occured while fetching dishes');
            err.clientMessage = 'Cannot fetch dishes. Please try again later..';
            err.statusCode = 404;
            return next(err);
        }
        const dishCount = result.rows.length === 0 ? 0 : result.rows[0].count;
        const dataToSend = {
            totalDishes: dishCount,
            data: result.rows
        };
        res.status(200).json(dataToSend);
    }
    catch (e) {
        next(e);
    }
});
const uploadImage = (request, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const req = request;
    const { restId, dishId } = req.body;
    const client = yield index_2.default.connect();
    try {
        const file = req.file;
        const fileType = file === null || file === void 0 ? void 0 : file.originalname.split('.')[1];
        if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
            if (!dishId) {
                //only uploading venue photos
                const path = 'restaurants/' + restId + '/venue/';
                const fileName = (file === null || file === void 0 ? void 0 : file.originalname.split('.')[0]) + '-' + Date.now() + `.${fileType}`;
                const firebaseFileName = path + fileName;
                yield client.query('BEGIN');
                yield index_3.default.file(firebaseFileName).createWriteStream().end(file === null || file === void 0 ? void 0 : file.buffer);
                const newRestImage = yield index_1.default.addImage(fileName, path, 'restaurant');
                yield index_1.default.addRestImageDetails(restId, newRestImage.rows[0].id);
                yield client.query('COMMIT');
                res.status(200).send('File uploaded successfully!');
            }
            else {
                //only uploading dish photos
                const path = 'restaurants/' + restId + '/dishes/';
                const fileName = (file === null || file === void 0 ? void 0 : file.originalname.split('.')[0]) + '-' + Date.now() + `.${fileType}`;
                const firebaseFileName = path + fileName;
                yield client.query('BEGIN');
                yield index_3.default.file(firebaseFileName).createWriteStream().end(file === null || file === void 0 ? void 0 : file.buffer);
                const newDishImage = yield index_1.default.addImage(fileName, path, 'dish');
                yield index_1.default.addDishImageDetails(dishId, newDishImage.rows[0].id);
                yield client.query('COMMIT');
                res.status(200).send('File uploaded successfully!');
            }
        }
        else {
            const err = new Error(`Uploaded file is of type ${fileType}. Must be an image`);
            err.statusCode = 401;
            err.clientMessage = 'The file should be .jpg .jpeg .png';
            return next(err);
        }
    }
    catch (err) {
        yield client.query('ROLLBACK');
        client.release();
        next(err);
    }
});
const subadmin = {
    login,
    logout,
    addUser,
    addRestaurant,
    addDish,
    getDishes,
    getRestaurants,
    getUsers,
    uploadImage
};
exports.default = subadmin;
