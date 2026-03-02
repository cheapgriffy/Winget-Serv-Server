const mysql = require("mysql2/promise")

// TODO need to had those to a .env
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "winget_serv"
})

module.exports = pool;