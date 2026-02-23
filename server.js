const express = require('express')
const app = express()

const PORT = 3000

// This contain all "caution sign" that will be broadcasted to terminal
const terminal_output_header = {
    error: `echo "\x1b[31m
    +------------------------------+\n
    |  Oopps a PROBLEM occured...  |\n
    +------------------------------+\n
    \x1b[0m"`,

    caution: `echo "\x1b[33m
    +----------------------------------------+\n
    |      You're executing a script         |\n
    |    Virtually everything is possible    |\n
    |    Make sure you trust the source      |\n
    |----------------------------------------|\n
    |   You can manually browse the script   |\n
    |     by puting it on any web browser    |\n
    +----------------------------------------+\n
    \x1b[0m"`
}

//! TODO MAKE IT BETTER, REMOVE LATER
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

app.get('/inst/:user_id/:script_id', (req, res) => {

    const user_query = req.params.user_id
    const script_query = req.params.script_id

    // get script content from data. sent it to process, handle errors
    const user_object = DEBUG_DATA.find((u) => u.username == user_query)
    if(user_object != undefined){
        const script_object = user_object.scripts.find((s) => s.id == script_query)

        if(script_object != undefined){
            sendProcessing(script_object.content, "caution", res, req)
        } else {
            sendProcessing("Script not found", "error", res, req)
        }
    } else {
        sendProcessing("User not found", "error", res, req)
    }

})

/**
 * Check and convert data to required media
 * @param {raw data to send} content 
 * @param {banner to display in terminal mode} header 
 * @param {local express res from sender} res 
 * @param {local req object from sender} req 
 * @param {*} userAgent 
 */
function sendProcessing(content, header = undefined, res, req){
    // TODO OS detect
    // TODO I dont think curl get detected
    
    // req.headers IS NOT A ARRAY. you cant use req.headers.user-agent because of the character -
    // || '' serv as a "or is just a empty string" to prevent crash on http request that doesnt have user-agent header
    const userAgent = req.headers['user-agent'] || '';
    const isTerminal = userAgent.includes('PowerShell') || userAgent.includes('curl');

    /**
     * Convert data to printable format for terminal
     * NOTE: irm, curl etc...  cant handle status code
     * @param {raw string information} script 
     * @returns terminal friendly string
     */
    const terminaliffy_send = (script, header) => {
        console.log(`a terminal was detected. and got sent: ${script}`)
        let current_header = ''

        switch(header){
            case "error":
                current_header = terminal_output_header.error
                break
            case "caution":
                current_header = terminal_output_header.caution
                break
        }

        return current_header + script + `echo "\n\x1b[33mScript executed successfully\x1b[0m"`
    }

    if(isTerminal){
        res.send(terminaliffy_send(content, header))
    } else {
        res.status(200).send(content)
    }
}



app.listen(PORT, () => {
    console.log(`
        Usage /inst/username/script_id\n
        Server is listening at http://localhost:${PORT}
        `)
    }
)