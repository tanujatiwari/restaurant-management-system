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
const index_1 = __importDefault(require("../models/index"));
const query = {
    getAllRestaurants: (limit, offset, filterCol, filterOrder) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with all_rest as(
                select id, user_id, name, location, ratings from restaurants where is_archived=false
            )
            select * from all_rest
            join (select count(*) as count from all_rest) as total_restaurants on TRUE
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset]);
    }),
    getAllDishes: (limit, offset, filterCol, filterOrder, restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with all_dishes as(
                select id, restaurant_id, name, description, user_id from dishes
                where restaurant_id=$1 and is_archived=false
            )
            select * from all_dishes
            join (select count(*) as count from all_dishes) as total_dishes on TRUE
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [restaurantId, limit, offset]);
    }),
    addUserAddress: (userId, address, geopoint) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into addresses(user_id, address, geopoint)
            values($1, $2, $3)
        `, [userId, address, geopoint]);
    }),
    addNewUser: (email, hashedPassword, name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into users (email, password, name)
            values ($1, $2, $3) returning id
        `, [email, hashedPassword, name]);
    }),
    addUser: (email, hashedPassword, name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into users (email,password,name)
            values ($1, $2, $3) 
            on conflict (email) do nothing
        `, [email, hashedPassword, name]);
    }),
    addRole: (userId, userRole, createdBy) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into roles (user_id, role, created_by)
            values ($1, $2, $3)
            on conflict (user_id,role)
            do update set role=$2
        `, [userId, userRole, createdBy]);
    }),
    createNewSession: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into sessions(user_id)
            values ($1) returning session_id
        `, [userId]);
    }),
    getUserCredentials: (email) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            select id,password from users
            where email=$1 and is_archived=false
        `, [email]);
    }),
    getAdminCredentials: (email, userRole) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            select id,password from users u
            join roles r on id=user_id
            where email=$1 and role=$2 and u.is_archived=false and r.is_archived=false
        `, [email, userRole]);
    }),
    logout: (currentDate, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
        update sessions set end_time=$1
        where session_id=$2
    `, [currentDate, sessionId]);
    }),
    addRest: (name, geopoint, adminId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            insert into restaurants (name,location,user_id)
            values($1, $2, $3')
            on conflict (name,geopoint)
            do update set
        `, [name, geopoint, adminId]);
    }),
    addDish: (name, description, adminId, restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
        insert into dishes (name, description, user_id, restaurant_id)
        values($1, $2, $3, $4)
    `, [name, description, adminId, restaurantId]);
    }),
    getUsersBySubadmin: (subadminId, filterCol, filterOrder, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with cte_users as(
                select id as user_id, email, name,is_archived from users where is_archived=false
            )
            select * from cte_users
            join (select count(*) from roles where created_by=$1 and is_archived=false) as total_users_by_subadmin on true
            join roles r on r.user_id = cte_users.user_id
            where role='user' and created_by=$1
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [subadminId, limit, offset]);
    }),
    getRestaurantsBySubadmin: (subadminId, filterCol, filterOrder, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with cte_restaurants as(
                select id, name, location, ratings, user_id from restaurants
                where user_id=$1 and is_archived=false
            )
            select * from cte_restaurants
            join (select count(*) from restaurants where user_id=$1) as total_restaurants on true
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [subadminId, limit, offset]);
    }),
    getDishesBySubadmin: (subadminId, restaurantId, filterCol, filterOrder, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with cte_dishes as(
                select id, name, description, user_id, restaurant_id from dishes
                where user_id=$2 and is_archived=false and restaurant_id=$1
            )
            select * from cte_dishes
            join (select count(*) from dishes where user_id=$2) as total_dishes on true
            order by ${filterCol} ${filterOrder}
            limit $3 offset $4;
        `, [restaurantId, subadminId, limit, offset]);
    }),
    getAllSubadmins: (filterCol, filterOrder, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
        return yield index_1.default.query(`
            with cte_subadmins as(
                select id as user_id,email,name from users where is_archived=false
            )
            select * from cte_subadmins
            join roles r on r.user_id=cte_subadmins.user_id
            join (select count(*) from roles r where role='subadmin' and r.is_archived=false) as total_subadmins on true
            where r.role='subadmin' and r.is_archived=false
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset]);
    }),
    getAllUsers: (filterCol, filterOrder, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            with cte_users as(
                select id as user_id ,email,name from users where is_archived=false
            )
            select * from cte_users
            join roles using(user_id)
            join (select count(*) from roles where role='user' and is_archived=false) as total_users on true
            where role='user' and roles.is_archived=false
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset]);
    }),
    checkAddressExists: (userId, geopoint) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select user_id, address from addresses
            where user_id=$1 and geopoint ~= $2::point and is_archived = false 
        `, [userId, geopoint]);
    }),
    checkRestaurantOwner: (subadminId, restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select id from restaurants
            where restaurant_id=$1 and user_id=$2
        `, [restaurantId, subadminId]);
    }),
    checkValidSession: (sessionId, role) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select user_id from sessions
            join roles using(user_id)
            where session_id=$1 and end_time is null and role=$2 and is_archived=false
        `, [sessionId, role]);
    }),
    checkUserRoleExists: (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select user_id, role from roles
            where user_id=$1 and role=$2 and is_archived=false
        `, [userId, role]);
    }),
    checkRestaurantExists: (restaurantName, geopoint) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select id from restaurants
            where name=$1 and location ~=$2::point and is_archived=false
        `, [restaurantName, geopoint]);
    }),
    checkDishExists: (dishName, restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
            select id from dishes
            where name=$1 and restaurant_id=$2 and is_archived=false
        `, [dishName, restaurantId]);
    }),
    checkRestaurantIdValid: (restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
        select name from restaurants
        where id =$1 and is_archived=false
    `, [restaurantId]);
    }),
    getAllAddresses: (userIdArray) => __awaiter(void 0, void 0, void 0, function* () {
        return index_1.default.query(`
        select user_id, address from addresses
        where user_id=any ($1) and is_archived=false
    `, [userIdArray]);
    })
};
exports.default = query;
