const db = require("../config/db"); // mysql2 pool/connection instance

/**
 * @typedef {Object} Script
 * @property {number}  id
 * @property {string}  public_id
 * @property {string}  name
 * @property {string|null} description
 * @property {string[]} content   - Array of raw shell commands (stored as JSON)
 * @property {number}  user_id
 */

/**
 * Find a script by its public_id (used for public access via URL)
 * @param {string} publicId
 * @returns {Promise<Script|null>}
 */
async function findByPublicId(publicId) {
  const [rows] = await db.execute(
    "SELECT id, public_id, name, description, content, user_id FROM scripts WHERE public_id = ? LIMIT 1",
    [publicId]
  );

  if (rows.length === 0) return null;

  const script = rows[0];
  script.content = parseContent(script.content);
  return script;
}

/**
 * Find a script by its internal id
 * @param {number} id
 * @returns {Promise<Script|null>}
 */
async function findById(id) {
  const [rows] = await db.execute(
    "SELECT id, public_id, name, description, content, user_id FROM scripts WHERE id = ? LIMIT 1",
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
async function findAllByUser(userId) {
  const [rows] = await db.execute(
    "SELECT id, public_id, name, description, content, user_id FROM scripts WHERE user_id = ?",
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    content: parseContent(row.content),
  }));
}

/**
 * Create a new script
 * @param {{ name: string, description?: string, content: string[], user_id: number }} data
 * @returns {Promise<Script>}
 */
async function create({ name, description = null, content, user_id }) {
  const publicId = generatePublicId();
  const contentJson = JSON.stringify(content);

  const [result] = await db.execute(
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
async function remove(id) {
  const [result] = await db.execute("DELETE FROM scripts WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse JSON content field — always returns an array
 * @param {string|any[]} raw
 * @returns {string[]}
 */
function parseContent(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate a short random alphanumeric public id (8 chars)
 * @returns {string}
 */
function generatePublicId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = { findByPublicId, findById, findAllByUser, create, remove };
