"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const subadmin_1 = __importDefault(require("../controllers/subadmin"));
const authenticateSubadmin_1 = __importDefault(require("../middlewares/authenticateSubadmin"));
const validations_1 = __importDefault(require("../middlewares/validations"));
router.post('/login', validations_1.default.validateLoginDetails, subadmin_1.default.login);
router.post('/add/user', authenticateSubadmin_1.default, validations_1.default.validateRegisterDetails, subadmin_1.default.addUser);
router.post('/add/restaurants', authenticateSubadmin_1.default, validations_1.default.validateAddRestaurant, subadmin_1.default.addRestaurant);
router.post('/restaurants/:restId/dishes', authenticateSubadmin_1.default, validations_1.default.validateAddDish, subadmin_1.default.addDish);
router.post('/logout', authenticateSubadmin_1.default, subadmin_1.default.logout);
router.get('/users', authenticateSubadmin_1.default, subadmin_1.default.getUsers);
router.get('/restaurants', authenticateSubadmin_1.default, subadmin_1.default.getRestaurants);
router.get('/:restId/dishes', authenticateSubadmin_1.default, subadmin_1.default.getDishes);
exports.default = router;
