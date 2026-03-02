const userModel = require("../models/user.model")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res, next) => {
    try{
        const user_info = { username, email, password } = req.body

        // switch(user_info){
        //     case !user_info.username:
        //         res.status(400).json({
        //             error: "Bad request",
        //             message: "A username is required"
        //         })
        //         break
        //     case !user_info.email:
        //         res.status(400).json({
        //             error: "Bad request",
        //             message: "An email is required"
        //         })
        //         break
        //     case !user_info.password:
        //         res.status(400).json({
        //             error: "Bad request",
        //             message: "A password is required"
        //         })
        //         break
        // }

        if(!user_info.username || !user_info.email || !user_info.password){
            res.status(400).json({
                error: "Bad request",
                message: "A provided field is blank"
            })
        }

        const already_existing = await userModel.getByUsername(user_info.username)
        if(already_existing){
            return res.status(409).json({
                error: "Conflict",
                message: "User already exists"
            })
        }

        const hashed_password = await bcrypt.hash(user_info.password, 8)

        await userModel.createUser(user_info.username, user_info.email, hashed_password)
        res.status(200).json({
            message: "User created succesfully",
            username: user_info.username,
            email: user_info.email
        })

    }catch(err) {
        console.log(err)
        // if email already 
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            error: "Conflict",
            message: "Email already registred" });
        }
        next()
    }
} 

const removeUser = async (req, res, next) => {
    try{
        const remove_request = { id } = req.body
        if(!remove_request){
            res.send(401).json({
                error: "Bad Request",
                message: "A user id is required"
            })
        }

        const current_user = await userModel.getById(req.userId)
        if(current_user.id != remove_request.id && current_user.role_id != "admin"){
            return res.status(403).json({
                error: "Forbidden",
                message: "You are not allowed to remove this user"
            })
        }


        const removed_user = await userModel.removeById(remove_request.id)
        res.status(200).json({
            message: `User ${remove_request.id} removed succesfully`
        })
        
    }catch(err){
        console.log(err)
        next()
    }
}

const getById = async (req, res, next) => {
    try{
        const id = Number(req.params.id)

        const user = await userModel.getById(id)
        return res.status(200).json({user})
    }catch(err){
        next()
    }
}

const login = async (req, res, next) => {
    try{
        const user_info = { username, password } = req.body

        if(!user_info){
            res.status(401).json({
                error: "Bad Request",
                message: "A username and a password is required"
            })
        }

        const user = await userModel.getByUsername(user_info.username)
        if(!user){
            return res.status(404).json({
                error: "Creditential",
                message: "Username not found"
            })
        }

        
        const valid_password = await bcrypt.compare(user_info.password, user.hashed_password)
        if(!valid_password){
            return res.status(404).json({
                error: "Creditential",
                message: "Invalid password"
            })
        }

        // store receved user.id from DB inside token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        res.status(200).json({
            message: "Authentification succesful",
            token
        })
    } catch(err) {
        console.log(err)
        next()
    }
}

const getMe = async (req, res, next) => {
    try{
        const user = await userModel.getById(req.userId)
        return res.status(200).json({user})
    }catch(err){
        console.log(err)
        next()
    }
}

module.exports = { createUser, removeUser, getById, login, getMe }