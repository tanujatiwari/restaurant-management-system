"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const database_json_1 = __importDefault(require("../database.json"));
const pool = new pg_1.Pool(database_json_1.default['dev']);
exports.default = pool;
