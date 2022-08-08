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
const index_1 = __importDefault(require("../dbHelper/index"));
function authenticateSubadmin(request, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = request;
        const sessionId = req.headers.sessionid;
        if (!sessionId) {
            const err = new Error('Could not find Session Id in database');
            err.clientMessage = 'Please login or register first';
            err.statusCode = 400;
            return next(err);
        }
        const checkValidSession = yield index_1.default.checkValidSession(sessionId, 'subadmin');
        if (!checkValidSession) {
            const err = new Error();
            return next(err);
        }
        if (checkValidSession.rows.length === 0) {
            const err = new Error('Could not find session details in database');
            err.statusCode = 403;
            err.clientMessage = 'This is an invalid session. Please login again...';
            return next(err);
        }
        req.sessionId = sessionId;
        req.subadminId = checkValidSession.rows[0].user_id;
        next();
    });
}
exports.default = authenticateSubadmin;
