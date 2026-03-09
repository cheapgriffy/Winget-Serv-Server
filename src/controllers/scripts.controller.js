const scriptModel = require("../models/script.model")
const userModel = require("../models/user.model")


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


/**
 * get script from database based on public id, and send it to process, to be execute
 * require id param from ./scripts.route.js
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getScriptByPublicId = async (req, res, next) => {
    try{
        const script = await scriptModel.getScriptByPublicId(req.params.public_script_id)
        sendProcessing(script.content, "caution", res, req)
    } catch(err) {
        console.log(err)
        next(err)
    }
}

/**
 * Check and convert data to required media
 * @param {raw data to send} content 
 * @param {banner to display in terminal mode} header 
 * 
 * @param {local express res from sender} res 
 * @param {local req object from sender} req 
 */
const sendProcessing = async (content, header = undefined, res, req) => {
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
        script = JSON.parse(script)
        let current_header = undefined

        // choses header to display to user
        switch(header){
            case "error":
                current_header = terminal_output_header.error
                break
            case "caution":
                current_header = terminal_output_header.caution
                break
        }
        

        let send_script = undefined
        script.forEach(element => {
            send_script += element
        });
        console.log(send_script)

        //TODO based on os detect, make a prompt that require userinput to run. to make user read header first
        return current_header + script + `echo "\n\x1b[33mScript executed successfully\x1b[0m"`
    }

    if(isTerminal){
        res.send(terminaliffy_send(content, header))
    } else {
        res.status(200).send(content)
    }
}

/**
 * Send Script to database
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const createScript = async (req, res, next) => {
    const user_id = req.userId
    const { name, description } = req.body
    const content = req.body.content

    try{
        if (!name || !description || !content){
            return res.status(400).json({
                error: "Bad request",
                message: "A provided field is blank"
            })
        }
        if(!user_id){
            return res.status(400).json({
                error: "Bad request",
                message: "You are not logged in, or does not have permission to do this action"
            })
        }

        const script_response = await scriptModel.addScript(user_id, name, description, content)
        
        res.status(200).json(script_response)
    } catch(err){
        console.log(err)
        next(err)
    }
}

const removeScript = async (req, res, next) => {
    const user_id = req.userId
    const { id } = req.body
    try{
        const current_user = await userModel.getById(user_id)
        const script = await scriptModel.getScriptById(id)

        if(!script){
            return res.status(404).json({
                error: "Not found",
                message: "Script not found"
            })
        }

        // Check ownership
        if(script.user_id != user_id || script.user_id == undefined || current_user.role_name != "admin"){
            return res.status(403).json({
                error: "Forbidden",
                message: "You are not allowed to remove this script"
            })
        }

        const response = await scriptModel.removeScript(user_id, id).then(() => {
            res.status(200).json({
                message: "Script removed succesfully",
                script_id: id
            })
        })
        
    } catch(err){
        console.log(err)
        next(err)
    }
}

module.exports = { sendProcessing, createScript, getScriptByPublicId, removeScript }