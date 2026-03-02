const pool = require("../config/db")

/**
 * Send a new user to the database
 * @param {username} name 
 * @param {*} email 
 * @param {*} hashed_password 
 * @returns 
 */
const createUser = async (name, email, hashed_password) => {
    const [rows] = await pool.query(`
        INSERT INTO users (name, email, hashed_password)
        VALUES (?,?,?)
        `, [name, email, hashed_password])

        return rows
}

const removeById = async (id) => {
    const [rows] = await pool.query(`
        DELETE FROM users WHERE id = ?
        `, [id])

    return rows[0]
}

/**
 * Fetch user by its username inside the database
 * @param {String} username 
 * @returns the user object from database
 */
const getByUsername = async (username) => {
    const [rows] = await pool.query(`
        SELECT * FROM users WHERE name = ?
        `, [username])

    return rows[0]
}

const getById = async (id) => {
    const [rows] = await pool.query(`
        SELECT * FROM users WHERE id = ?
        INNER JOIN roles ON users.role_id = roles.id
        `, [id])
        
    return rows[0]
}


module.exports = { createUser, getByUsername, removeById, getById }