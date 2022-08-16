import { PoolClient } from 'pg'
import pool from '../models/index'

const query = {
    getAllRestaurants: async (limit: number, offset: number, filterCol: string, filterOrder: string) => {
        return await pool.query(`
            with all_rest as(
                select id, user_id, name, location, ratings from restaurants where is_archived=false
            )
            select * from all_rest
            join (select count(*) as count from all_rest) as total_restaurants on TRUE
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset])
    },

    getAllDishes: async (limit: number, offset: number, filterCol: string, filterOrder: string, restaurantId: string) => {
        return await pool.query(`
            with all_dishes as(
                select id, restaurant_id, name, description, user_id from dishes
                where restaurant_id=$1 and is_archived=false
            )
            select * from all_dishes
            join (select count(*) as count from all_dishes) as total_dishes on TRUE
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [restaurantId, limit, offset])
    },

    addUserAddress: async (userId: string, address: string, geopoint: string) => {
        return await pool.query(`
            insert into addresses(user_id, address, geopoint)
            values($1, $2, $3)
        `, [userId, address, geopoint])
    },

    addNewUser: async (email: string, hashedPassword: string, name: string) => {
        return await pool.query(`
            insert into users (email, password, name)
            values ($1, $2, $3) returning id
        `, [email, hashedPassword, name])
    },

    addUser: async (email: string, hashedPassword: string, name: string) => {
        return await pool.query(`
            insert into users (email,password,name)
            values ($1, $2, $3) 
            on conflict (email) do nothing
        `, [email, hashedPassword, name])
    },

    addRole: async (userId: string, userRole: string, createdBy: string) => {
        return await pool.query(`
            insert into roles (user_id, role, created_by)
            values ($1, $2, $3)
            on conflict (user_id,role)
            do update set role=$2
        `, [userId, userRole, createdBy])
    },

    createNewSession: async (userId: string) => {
        return await pool.query(`
            insert into sessions(user_id)
            values ($1) returning session_id
        `, [userId])
    },

    getUserCredentials: async (email: string) => {
        return await pool.query(`
            select id,password from users
            where email=$1 and is_archived=false
        `, [email])
    },

    getAdminCredentials: async (email: string, userRole: string) => {
        return await pool.query(`
            select id,password from users u
            join roles r on id=user_id
            where email=$1 and role=$2 and u.is_archived=false and r.is_archived=false
        `, [email, userRole])
    },

    logout: async (currentDate: string, sessionId: string) => {
        return await pool.query(`
        update sessions set end_time=$1
        where session_id=$2
    `, [currentDate, sessionId]);
    },

    addRest: async (name: string, location: string, adminId: string) => {
        return await pool.query(`
            insert into restaurants (name,location,user_id)
            values($1, $2, $3) returning id
        `, [name, location, adminId])
    },

    addDish: async (name: string, description: string, adminId: string, restaurantId: string) => {
        return await pool.query(`
        insert into dishes (name, description, user_id, restaurant_id)
        values($1, $2, $3, $4) returning id
    `, [name, description, adminId, restaurantId])
    },

    getUsersBySubadmin: async (subadminId: string, filterCol: string, filterOrder: string, limit: number, offset: number) => {
        return await pool.query(`
            with cte_users as(
                select id as user_id, email, name,is_archived from users where is_archived=false
            )
            select * from cte_users
            join (select count(*) from roles where created_by=$1 and is_archived=false) as total_users_by_subadmin on true
            join roles r on r.user_id = cte_users.user_id
            where role='user' and created_by=$1
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [subadminId, limit, offset])
    },

    getRestaurantsBySubadmin: async (subadminId: string, filterCol: string, filterOrder: string, limit: number, offset: number) => {
        return await pool.query(`
            with cte_restaurants as(
                select id, name, location, ratings, user_id from restaurants
                where user_id=$1 and is_archived=false
            )
            select * from cte_restaurants
            join (select count(*) from restaurants where user_id=$1) as total_restaurants on true
            order by ${filterCol} ${filterOrder}
            limit $2 offset $3;
        `, [subadminId, limit, offset])
    },

    getDishesBySubadmin: async (subadminId: string, restaurantId: string, filterCol: string, filterOrder: string, limit: number, offset: number) => {
        return await pool.query(`
            with cte_dishes as(
                select id, name, description, user_id, restaurant_id from dishes
                where user_id=$2 and is_archived=false and restaurant_id=$1
            )
            select * from cte_dishes
            join (select count(*) from dishes where user_id=$2) as total_dishes on true
            order by ${filterCol} ${filterOrder}
            limit $3 offset $4;
        `, [restaurantId, subadminId, limit, offset])
    },

    getAllSubadmins: async (filterCol: string, filterOrder: string, limit: number, offset: number) => {
        return await pool.query(`
            with cte_subadmins as(
                select id as user_id,email,name from users where is_archived=false
            )
            select * from cte_subadmins
            join roles r on r.user_id=cte_subadmins.user_id
            join (select count(*) from roles r where role='subadmin' and r.is_archived=false) as total_subadmins on true
            where r.role='subadmin' and r.is_archived=false
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset])
    },

    getAllUsers: async (filterCol: string, filterOrder: string, limit: number, offset: number) => {
        return pool.query(`
            with cte_users as(
                select id as user_id ,email,name from users where is_archived=false
            )
            select * from cte_users
            join roles using(user_id)
            join (select count(*) from roles where role='user' and is_archived=false) as total_users on true
            where role='user' and roles.is_archived=false
            order by ${filterCol} ${filterOrder}
            limit $1 offset $2;
        `, [limit, offset])
    },

    checkAddressExists: async (userId: string, geopoint: string) => {
        return pool.query(`
            select user_id, address from addresses
            where user_id=$1 and geopoint ~= $2::point and is_archived = false 
        `, [userId, geopoint])
    },

    checkRestaurantOwner: async (subadminId: string, restaurantId: string) => {
        return pool.query(`
            select id from restaurants
            where restaurant_id=$1 and user_id=$2
        `, [restaurantId, subadminId])
    },

    checkValidSession: async (sessionId: string, role: string) => {
        return pool.query(`
            select user_id from sessions
            join roles using(user_id)
            where session_id=$1 and end_time is null and role=$2 and is_archived=false
        `, [sessionId, role])
    },

    checkUserRoleExists: async (userId: string, role: string) => {
        return pool.query(`
            select user_id, role from roles
            where user_id=$1 and role=$2 and is_archived=false
        `, [userId, role])
    },

    checkRestaurantExists: async (restaurantName: string, geopoint: string) => {
        return pool.query(`
            select id from restaurants
            where name=$1 and location ~=$2::point and is_archived=false
        `, [restaurantName, geopoint])
    },

    checkDishExists: async (dishName: string, restaurantId: string) => {
        return pool.query(`
            select id from dishes
            where name=$1 and restaurant_id=$2 and is_archived=false
        `, [dishName, restaurantId])
    },

    checkRestaurantIdValid: async (restaurantId: string) => {
        return pool.query(`
            select name from restaurants
            where id =$1 and is_archived=false
    `, [restaurantId])
    },

    getAllAddresses: async (userIdArray: Array<string>) => {
        return pool.query(`
            select user_id, address from addresses
            where user_id=any ($1) and is_archived=false
    `, [userIdArray])
    },

    addImage: async (name: string, path: string, category: string) => {
        return pool.query(`
            insert into images(name,path,category) values($1,$2,$3) returning id;
        `, [name, path, category])
    },

    addRestImageDetails: async (restaurantId: string, imageId: string) => {
        return pool.query(`
            insert into restaurant_upload_details values($1,$2)
        `, [restaurantId, imageId])
    },

    addDishImageDetails: async (dishId: string, imageId: string) => {
        return pool.query(`
            insert into dish_upload_detail values($1,$2)
    `, [dishId, imageId])
    },

    getAllRestaurantImages: async (category: string, restaurants: Array<string>) => {
        return pool.query(`
            select id,name,path, created_at,restaurant_id from images
            join restaurant_upload_details on id=image_id
            where restaurant_id=any($2) and category=$1 
        `, [category, restaurants])
    },

    getAllDishImages: async (category: string, dishes: Array<string>) => {
        return pool.query(`
            select id,name,path, created_at,dish_id from images
            join dish_upload_detail on id=image_id
            where dish_id=any($2) and category=$1 
        `, [category, dishes])
    }
}

export default query;
