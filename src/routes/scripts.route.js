const router = require("express").Router()
const scriptsController = require("../controllers/script.controller")
const auth = require("../middlewares/auth")

    // get a list of all user scripts
router.get("/list", auth, scriptsController.getAllUserScript)

    // Create new script, 
    //* { "name", "description", "content":ARRAY }
router.post("/create", auth, scriptsController.createScript)

    // Temrinal execution + Browser view
    //* Optional ?raw=true option
router.get("/:public_id", scriptsController.getScript)


    // Delete a script that is owned by user
    //* { "id":INT }
router.delete("/remove", auth, scriptsController.deleteScript)


module.exports = router