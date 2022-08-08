"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const admin_1 = __importDefault(require("../controllers/admin"));
const authenticateAdmin_1 = __importDefault(require("../middlewares/authenticateAdmin"));
const validations_1 = __importDefault(require("../middlewares/validations"));
router.post('/login', validations_1.default.validateLoginDetails, admin_1.default.login);
router.post('/logout', authenticateAdmin_1.default, admin_1.default.logout);
router.get('/subadmins', authenticateAdmin_1.default, admin_1.default.getAllSubadmins);
router.get('/users', authenticateAdmin_1.default, admin_1.default.getAllUsers);
router.post('/add/member', authenticateAdmin_1.default, validations_1.default.validateAddMember, admin_1.default.addMember);
router.post('/add/restaurants', authenticateAdmin_1.default, validations_1.default.validateAddRestaurant, admin_1.default.addRestaurant);
router.post('/restaurants/:restId/dishes', authenticateAdmin_1.default, validations_1.default.validateAddDish, admin_1.default.addDish);
exports.default = router;
