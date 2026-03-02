const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try{
        const header = req.headers.authorization;

        if(!header || !header.startsWith("Bearer ")){
            return res.status(401).json({
                error: "Unauthorized",
                message: "Missing Token"
            })
        }

        const token = header.split(" ")[1];

        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = payload.userId;

        // when using router.use("/test", auth, testThingy)
        // it forwards his state to testThingy.
        next()
    }catch(err){
        res.status(401).json({
            error: "Unauthorized",
            message: "Invalid Token"
        })
    }
}

module.exports = auth 