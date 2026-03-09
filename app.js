require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())

const scriptRoute = require('./src/routes/scripts.route')
const userRoute = require('./src/routes/user.route')
const configDB = require('./src/config/db')


const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || "localhost"


app.use("/user", userRoute)
app.use("/script", scriptRoute)

configDB.testDBConnection()
app.listen(PORT, () => {
    console.log(`
        Server is listening at http://${HOST}:${PORT}
        `)
    }
)
