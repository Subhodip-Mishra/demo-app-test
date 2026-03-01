// src/database.js
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

async function getUsers() {
    const result = await pool.query('SELECT * FROM users')
    return result.rows
}

module.exports = { getUsers }