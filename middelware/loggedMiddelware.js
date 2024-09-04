const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const ownerModel = require("../models/ownerModel")

module.exports = async function(req, res, next) {
    console.log("Entering isLoggedin middleware");
    
    if (!req.cookies.token) {
        console.log("No token found in cookies");
        req.flash("error", "You need to login first")
        return res.redirect("/")
    }
    
    try {
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY)
        console.log("Token decoded successfully");
        
        let user;
        if (decoded.role === 'owner') {
            user = await ownerModel.findById(decoded.id).select("-password")
        } else {
            user = await userModel.findById(decoded.id).select("-password")
        }
        
        if (!user) {
            console.log("User/Owner not found in database");
            req.flash("error", "User/Owner not found")
            return res.redirect("/")
        }
        
        console.log(`${decoded.role.charAt(0).toUpperCase() + decoded.role.slice(1)} found:`, user.email);
        req.user = { ...user.toObject(), role: decoded.role }

        next()
    } catch (error) {
        console.error("Authentication error:", error);
        if (error instanceof jwt.JsonWebTokenError) {
            req.flash("error", "Invalid token. Please login again.");
        } else if (error instanceof jwt.TokenExpiredError) {
            req.flash("error", "Your session has expired. Please login again.");
        } else {
            req.flash("error", "Authentication failed. Please try again.");
        }
        res.clearCookie('token');  // Clear the invalid token
        return res.redirect("/");
    }
}