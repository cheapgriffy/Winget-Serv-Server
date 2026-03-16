const db = require("../config/db"); // mysql2 pool/connection instance

/**
 * @typedef {Object} Script
 * @property {number}  id
 * @property {string}  public_id
 * @property {string}  name
 * @property {string|null} description
 * @property {string[]} content   Array of raw shell commands (stored as JSON)
 * @property {number}  user_id
 */

/**
 * Find a script by its public_id (used for public access via URL)
 * @param {string} publicId
 * @returns {Promise<Script|null>}
 */
const findByPublicId = async (publicId) => {
    const [rows] = await db.pool.query(
        `SELECT id, public_id, name, description, content, user_id 
        FROM scripts 
        WHERE public_id = ? 
        LIMIT 1`,
        [publicId]
    );

    if (rows.length === 0) return null;

    const script = rows[0];
    script.content = parseContent(script.content);
    return script;
}

/**
 * Find a script from his Database id
 * @param {number} id
 * @returns {Promise<Script|null>}
 */
const findById = async (id) => {
    const [rows] = await db.pool.query(
        `SELECT id, public_id, name, description, content, user_id 
        FROM scripts 
        WHERE id = ? 
        LIMIT 1`,
        [id]
    );

    if (rows.length === 0) return null;

    const script = rows[0];
    script.content = parseContent(script.content);
    return script;
}

/**
 * List all scripts belonging to a user
 * @param {number} userId
 * @returns {Promise<Script[]>}
 */
const findAllByUser = async (userId) => {
    const [rows] = await db.pool.query(
        `SELECT id, public_id, name, description, content, user_id 
        FROM scripts 
        WHERE user_id = ?`,
        [userId]
    );

    // Align all script into a array
    //* Always forgor about "..." from array, act as a kind of foreach element
    return rows.map((row) => ({
        ...row,
        content: parseContent(row.content),
    }));
}

/**
 * Create a new script in Database
 * @param {{ name: string, description?: string, content: string[], user_id: number }} data
 * @returns {Promise<Script>}
 */
const create = async ({ name, description = null, content, user_id }) => {
    const publicId = generatePublicId();
    const contentJson = JSON.stringify(content);

    const [result] = await db.pool.query(
        "INSERT INTO scripts (public_id, name, description, content, user_id) VALUES (?, ?, ?, ?, ?)",
        [publicId, name, description, contentJson, user_id]
    );

    return findById(result.insertId);
}

/**
 * Delete a script by id — caller must verify ownership beforehand
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
    const [result] = await db.pool.query("DELETE FROM scripts WHERE id = ?", [id]);
    // outputs boolean, cause no need to display script info when deletion
    return result.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * JSON.parse() but forcefully return a array, blank if not
 * Prevent troubles since its used for script management
 * @param {string|any[]} raw
 * @returns {string[]}
 */
const parseContent = (raw) => {
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Generate number + caps letters,
 * @param {int} size amont of generated chars DEFAULT 8
 * @returns {string}
 */
const generatePublicId = (size = 8) => {
    return Math.random()                    // generate float
        .toString(36)                       // Change counting base, from base10 to base-36
            .substring(2, size + 2)         // Remove "0." from stringed float, and stop after 10 char //? (10 -2 => 8 char total)
                .toUpperCase();             // Easier to look at
}

module.exports = {
    findByPublicId,
    findById,
    findAllByUser,
    create,
    remove
};
