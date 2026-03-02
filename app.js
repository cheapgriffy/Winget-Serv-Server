require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.json())

const scriptRoute = require('./src/routes/scripts.route')
const userRoute = require('./src/routes/user.route')

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || "localhost"


//! TODO MAKE IT BETTER, REMOVE LATER
//! REMPLCE WITH DATABASE FROM MODEL
const DEBUG_DATA = [
    {
        id: 1,
        username: "test_user",
        scripts: [
            {
                id: 0,
                name: "test_script",
                content: `echo "test from the cmd"`
            }
        ]
    }
]

app.use("/user", userRoute)
app.use("/inst", scriptRoute)


app.listen(PORT, () => {
    console.log(`
        Server is listening at http://${HOST}:${PORT}
        `)
    }
)