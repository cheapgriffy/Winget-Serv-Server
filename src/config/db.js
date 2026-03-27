const mysql = require("mysql2/promise")
const configVariables = require("../config/launch.params").configVariables


const pool = mysql.createPool({
    host: configVariables.DB_HOST,
    port: configVariables.DB_PORT,
    user: configVariables.DB_LOGIN,
    password: configVariables.DB_PASSWD,
    database: configVariables.DB_NAME
})

const testDBConnection = async () => {
    try{
        const [solution] = await pool.query("SELECT 1 + 1 AS solution",)
        console.log(`
            \x1b[32m
            -------------------------
            ✔️  Database is connected
            -------------------------
            \x1b[0m`)
    } catch (err) {
        console.log(`
            \x1b[31m
            ------------------------
            Database isn't connected
            ------------------------
            \x1b[0m
            `)
        console.log(err)
        process.exit(1)
    }
}


// terminal color exit codes memo
//* \x1b[32m     YELLOW
//! \x1b[31m     RED
//  \x1b[0m      WHITE
const initiateDB = async () => {
    let connection;
    try{
        // pool use database, and we dont already have created it
        connection = await mysql.createConnection({
            host: configVariables.DB_HOST,
            port: configVariables.DB_PORT,
            user: configVariables.DB_LOGIN,
            password: configVariables.DB_PASSWD,
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${configVariables.DB_NAME}\``);
        await connection.query(`USE \`${configVariables.DB_NAME}\``);
        console.log("\x1b[32mDatabase selected or created.\x1b[0m");

        // roles first cause there's foreign key elsewhere
        await connection.query(`
            CREATE TABLE IF NOT EXISTS roles(
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT NOT NULL 
            )`);
        console.log("\x1b[32m'roles' table is ready.\x1b[0m");

        await connection.query(`INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'admin', 'Administrator with all permissions')`);
        await connection.query(`INSERT IGNORE INTO roles (id, name, description) VALUES (2, 'user', 'Standard user, can create scripts and edit them')`);
        console.log("\x1b[32mDefault roles inserted.\x1b[0m");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users(
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                role_id INT NOT NULL DEFAULT 2,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )`);
        console.log("\x1b[32m'users' table is ready.\x1b[0m");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS scripts(
                id INT PRIMARY KEY AUTO_INCREMENT,
                public_id VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                content JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                user_id INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);
        console.log("\x1b[32m'scripts' table is ready.\x1b[0m");

        console.log("\x1b[32mDatabase structure successfully initiated.\x1b[0m");

    } catch(err){
        console.error("\x1b[31mThere was a problem creating the DATABASE structure\x1b[0m", err);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = { pool, testDBConnection, initiateDB };