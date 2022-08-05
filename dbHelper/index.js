const pool = require('../models/index')

module.exports.getAllRestaurants = async (limit, offset, filterCol, filterOrder) => {
    return await pool.query(`
        with all_rest as(
            select id, user_id, name, location, ratings from restaurants where is_archived=false
        )
        select * from all_rest
        join (select count(*) as count from all_rest) as total_restaurants on TRUE
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset};
    `)
}

module.exports.getAllDishes = async (limit, offset, filterCol, filterOrder, restaurantId) => {
    return await pool.query(`
        with all_dishes as(
            select id, restaurant_id, name, description, user_id from dishes
            where restaurant_id='${restaurantId}' and is_archived=false
        )
        select * from all_dishes
        join (select count(*) as count from all_dishes) as total_dishes on TRUE
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset};
    `)
}

module.exports.addUserAddress = async (userId, address, geopoint) => {
    return await pool.query(`
        insert into addresses(user_id, address, geopoint)
        values('${userId}','${address}','${geopoint}')
    `)
}

module.exports.addNewUser = async (email, hashedPassword, name) => {
    return await pool.query(`
        insert into users (email, password, name)
        values ('${email}','${hashedPassword}','${name}') returning id
    `)
}

module.exports.addUser = async (email, hashedPassword, name) => {
    return await pool.query(`
        insert into users (email,password,name)
        values ('${email}','${hashedPassword}','${name}') 
        on conflict (email) do nothing
    `)
}

module.exports.addRole = async (userId, userRole, createdBy) => {
    return await pool.query(`
        insert into roles (user_id, role, created_by)
        values ('${userId}','${userRole}', '${createdBy}')
        on conflict (user_id,role)
        do update set role='${userRole}'
    `)
}

module.exports.createNewSession = async (userId) => {
    return await pool.query(`
        insert into sessions(user_id)
        values ('${userId}') returning session_id
    `)
}

module.exports.getUserCredentials = async (email) => {
    return await pool.query(`
        select id,password from users
        where email='${email}' and is_archived=false
    `)
}

module.exports.getAdminCredentials = async (email, userRole) => {
    return await pool.query(`
        select id,password from users u
        join roles r on id=user_id
        where email='${email}' and role='${userRole}' and u.is_archived=false and r.is_archived=false
    `)
}

module.exports.logout = async (currentDate, sessionId) => {
    return await pool.query(`
        update sessions set end_time='${currentDate}'
        where session_id='${sessionId}'
    `);
}

module.exports.addRest = async (name, geopoint, adminId) => {
    return await pool.query(`
        insert into restaurants (name,location,user_id)
        values('${name}','${geopoint}','${adminId}')
        on conflict (name,geopoint)
        do update set
    `)
}

module.exports.addDish = async (name, description, adminId, restaurantId) => {
    return await pool.query(`
        insert into dishes (name,description,user_id, restaurant_id)
        values('${name}','${description}','${adminId}', '${restaurantId}')
    `)
}

module.exports.getUsersBySubadmin = async (subadminId, filterCol, filterOrder, limit, offset) => {
    return await pool.query(`
        with cte_users as(
            select id as user_id, email, name,is_archived from users where is_archived=false
        )
        select * from cte_users
        join (select count(*) from roles where created_by='${subadminId}' and is_archived=false) as total_users_by_subadmin on true
        join roles r on r.user_id = cte_users.user_id
        where role='user' and created_by='${subadminId}'
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset}
    `)
}

module.exports.getRestaurantsBySubadmin = async (subadminId, filterCol, filterOrder, limit, offset) => {
    return await pool.query(`
        with cte_restaurants as(
            select id, name, location, ratings, user_id from restaurants
            where user_id='${subadminId}' and is_archived=false
        )
        select * from cte_restaurants
        join (select count(*) from restaurants where user_id='${subadminId}') as total_restaurants on true
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset}
    `)
}

module.exports.getDishesBySubadmin = async (subadminId, filterCol, filterOrder, limit, offset) => {
    return await pool.query(`
        with cte_dishes as(
            select id, name, description, user_id, restaurant_id from dishes
            where user_id='${subadminId}' and is_archived=false
        )
        select * from cte_dishes
        join (select count(*) from dishes where user_id='${subadminId}') as total_dishes on true
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset}
    `)
}

module.exports.getAllSubadmins = async (filterCol, filterOrder, limit, offset) => {
    return await pool.query(`
        with cte_subadmins as(
            select id as user_id,email,name from users where is_archived=false
        )
        select * from cte_subadmins
        join roles r on r.user_id=cte_subadmins.user_id
        join (select count(*) from roles r where role='subadmin' and r.is_archived=false) as total_subadmins on true
        where r.role='subadmin' and r.is_archived=false
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset}
    `)
}

module.exports.getAllUsers = async (filterCol, filterOrder, limit, offset) => {
    return pool.query(`
        with cte_users as(
            select id as user_id ,email,name from users where is_archived=false
        )
        select * from cte_users
        join roles using(user_id)
        join (select count(*) from roles where role='user' and is_archived=false) as total_users on true
        where role='user' and roles.is_archived=false
        order by ${filterCol} ${filterOrder}
        limit ${limit} offset ${offset}
    `)
}

module.exports.checkAddressExists = async (userId, geopoint) => {
    return pool.query(`
        select user_id, address from addresses
        where user_id='${userId}' and geopoint ~= '${geopoint}'::point and is_archived = false 
    `)
}

module.exports.checkValidSession = async (sessionId, role) => {
    return pool.query(`
        select user_id from sessions
        join roles using(user_id)
        where session_id='${sessionId}' and end_time is null and role='${role}' and is_archived=false
    `)
}

module.exports.checkUserRoleExists = async (userId, role) => {
    return pool.query(`
        select user_id, role from roles
        where user_id='${userId}' and role='${role}' and is_archived=false
    `)
}

module.exports.checkRestaurantExists = async (restaurantName, geopoint) => {
    return pool.query(`
        select id from restaurants
        where name='${restaurantName}' and location ~='${geopoint}'::point and is_archived=false
    `)
}

module.exports.checkDishExists = async (dishName, restaurantId) => {
    return pool.query(`
        select id from dishes
        where name='${dishName}' and restaurant_id='${restaurantId}' and is_archived=false
    `)
}

module.exports.checkRestaurantIdValid = async (restaurantId) => {
    return pool.query(`
        select name from restaurants
        where id ='${restaurantId}' and is_archived=false
    `)
}

module.exports.getAllAddresses = async (userIdArray) => {
    return pool.query(`select user_id, address from addresses where user_id=any ($1) and is_archived=false`, [userIdArray])
}