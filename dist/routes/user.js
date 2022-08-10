"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const user_1 = __importDefault(require("../controllers/user"));
const authenticateUser_1 = __importDefault(require("../middlewares/authenticateUser"));
const validations_1 = __importDefault(require("../middlewares/validations"));
const multer_1 = __importDefault(require("multer"));
// const upload = multer({ dest: process.env.FIREBASE_BUCKET })
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/restaurants', user_1.default.restaurants);
router.get('/restaurants/:restId/dishes', user_1.default.dishes);
router.post('/register', validations_1.default.validateRegisterDetails, user_1.default.register);
router.post('/login', validations_1.default.validateLoginDetails, user_1.default.login);
router.post('/logout', authenticateUser_1.default, user_1.default.logout);
router.post('/addresses', authenticateUser_1.default, validations_1.default.validateAddress, user_1.default.addAddress);
router.post('/profile-photo', authenticateUser_1.default, upload.single('image'), user_1.default.uploadPhoto);
exports.default = router;
