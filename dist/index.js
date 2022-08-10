"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const subadmin_1 = __importDefault(require("./routes/subadmin"));
const errorHandling_1 = __importDefault(require("./middlewares/errorHandling"));
app.use('/user', user_1.default);
app.use('/admin', admin_1.default);
app.use('/subadmin', subadmin_1.default);
app.use((req, res, next) => {
    const err = new Error(`Cannot GET ${req.path}`);
    err.statusCode = 404;
    err.clientMessage = `Requested URL ${req.path} not found`;
    next(err);
});
app.use(errorHandling_1.default);
const port = (process.env.SERVER_PORT || 3000);
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
