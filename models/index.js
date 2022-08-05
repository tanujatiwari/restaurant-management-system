const { Pool } = require('pg');
const poolConfig = require('../database.json')

const pool = new Pool(poolConfig['dev'])

pool.connect(async (err) => {
    if (err)
        return console.log("Pool connection err")
    console.log("Pool connected...")
})

module.exports = pool;