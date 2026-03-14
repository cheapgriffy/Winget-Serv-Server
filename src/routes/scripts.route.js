const router = require("express").Router()
const scriptsController = require("../controllers/script.controller")
const auth = require("../middlewares/auth")

router.get("/:public_id", auth, scriptsController.getScript())
router.post("/create", auth, scriptsController.createScript())
router.delete("/remove", auth, scriptsController.deleteScript())
router.get("/list", auth, scriptsController.getAllUserScript())


module.exports = router