const router = require("express").Router()
const userController = require("../controllers/user.controller")
const auth = require("../middlewares/auth")


router.post("/create", userController.createUser)
router.delete("/remove", auth, userController.removeUser)
router.get("/:id", auth, userController.getById)
router.post("/login", userController.login)
router.get("/me", auth, userController.getMe)


module.exports = router;