const userModel = require("../models/userModel")
const ownerModel = require("../models/ownerModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieparser = require("cookie-parser")
const {generateToken} = require("../utils/generateToken")
const Product = require("../models/productModels");

module.exports.registerUser = async function(req,res){
    try{
        let {name,email,password} = req.body
        let user = await userModel.findOne({email: email})
        if(user){
            res.status(501).send("user already exist")
        }
        bcrypt.genSalt(10 , function(err,salt){
            bcrypt.hash(password , salt , async (err,hash)=>{
                if(err){
                    res.send(err.message)
                }
                else{
                    let createdUser = await userModel.create({
                        name,
                        email,
                        password: hash
                    })
                    let token = generateToken(createdUser)
                    res.cookie("token" , token)
                    res.send("user created successfully")
                }
            })
        })
    }
    catch(err){
        res.send(err.message)
    }
}

module.exports.loginUser = async function(req, res) {
    try {
        let { email, password } = req.body;
        let user = await userModel.findOne({ email: email });
        let owner = await ownerModel.findOne({ email: email });

        if (!user && !owner) {
            req.flash("error", "User doesn't exist. Please create an account first.");
            return res.redirect("/");
        }

        let isMatch = false;
        let authenticatedUser = null;
        let isOwner = false;

        if (user) {
            isMatch = await bcrypt.compare(password, user.password);
            authenticatedUser = user;
        } else if (owner) {
            isMatch = await bcrypt.compare(password, owner.password);
            authenticatedUser = owner;
            isOwner = true;
        }

        if (isMatch) {
            let token = generateToken(authenticatedUser, isOwner);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'development',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            if (isOwner) {
                req.flash("success", "Logged in as owner successfully");
                return res.redirect("/owners/dashboard");
            } else {
                req.flash("success", "Logged in successfully");
                return res.redirect("/shop");
            }
        } else {
            req.flash("error", "Email or password is incorrect");
            return res.redirect("/");
        }
    } catch (error) {
        console.error('Login error:', error);
        req.flash("error", "An unexpected error occurred. Please try again.");
        return res.redirect("/");
    }
}

module.exports.logout = function(req, res) {
    res.clearCookie("token");
    req.flash("success", "Logged out successfully");
    res.redirect("/");
};