const router = require("express").Router()
const scriptsController = require("../controllers/scripts.controller")


router.get('/:user_id/:script_id', (req, res) => {

    const user_query = req.params.user_id
    const script_query = req.params.script_id

    // get script content from data. sent it to process, handle errors
    const user_object = DEBUG_DATA.find((u) => u.username == user_query)
    if(user_object != undefined){
        const script_object = user_object.scripts.find((s) => s.id == script_query)

        if(script_object != undefined){
            scriptsController.sendProcessing(script_object.content, "caution", res, req)
        } else {
            scriptsController.sendProcessing("Script not found", "error", res, req)
        }
    } else {
        scriptsController.sendProcessing("User not found", "error", res, req)
    }

})


module.exports = router