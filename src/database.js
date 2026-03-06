// src/database.js
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// Database interaction logic, in real implementation this would involve more complex queries and error handling
async function getUsers() {
    const result = await pool.query('SELECT * FROM users')
    return result.rows
}

module.exports = { getUsers }