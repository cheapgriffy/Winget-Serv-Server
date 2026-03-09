const pool = require("../config/db").pool
const { nanoid } = require("nanoid")

/**
 * add script to database.
 * @param {Int} user_id 
 * @param {string} name 
 * @param {string} description 
 * @param {json} content 
 * @returns 
 */
const addScript = async (user_id, name, description, content) => { 
    
    const public_id = nanoid(7)

    const [rows] = await pool.query(`
        INSERT INTO scripts (user_id, public_id, name, description, content)
        VALUES (?,?,?,?,?)
        `, [user_id, public_id, name, description, JSON.stringify(content)])

    return {
        message: "Script created succesfully",
        public_id,
    }
}

const getScriptByPublicId = async (public_id) => {
    const [rows] = await pool.query(`
        SELECT * FROM scripts WHERE public_id = ?
        `, [public_id])

    return rows[0]
}

const removeScript = async (user_id, id) => {
    const [rows] = await pool.query(`
        DELETE FROM scripts WHERE id = ? AND user_id = ?
        `, [id, user_id])

    return rows[0]
}

module.exports = { addScript, getScriptByPublicId, removeScript }
