const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logout } = require("../controllers/authController");
const isLoggedin = require("../middelware/loggedMiddelware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);  // Changed from POST to GET

// Protected Routes
router.get("/dashboard", isLoggedin, async function(req, res) {
    if (req.user.role === 'owner') {
        return res.redirect("/owners/dashboard");
    }
    res.render("userDashboard", { 
        user: req.user,
        success: req.flash('success'),
        error: req.flash('error')
    });
}); 

module.exports = router;