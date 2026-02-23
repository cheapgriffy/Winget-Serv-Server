const express = require('express')
const app = express()

const PORT = 3000

app.get('/', (req, res) => {
    res.status(200).send("hello world")
})

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`)
})