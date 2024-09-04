const express = require("express");
const router = express.Router();
const ownerModel = require("../models/ownerModel");
const isLoggedin = require("../middelware/loggedMiddelware");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");  // Ensure this path is correct
const Product = require("../models/productModels");  // Ensure this path is correct

if (process.env.NODE_ENV === "development") {
    router.post("/create", async (req, res) => {
        try {
            let existingOwners = await ownerModel.find();
            if (existingOwners.length > 0) {
                return res.status(403).send("An owner already exists. You don't have permission to create another.");
            }
            
            let { name, email, password } = req.body;
            
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            let createdOwner = await ownerModel.create({
                name,
                email,
                password: hashedPassword,  // Store the hashed password
            });
            
            // Generate a token for the new owner
            const token = generateToken(createdOwner, true);  // true indicates it's an owner token
            
            // Set the token as a cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'development',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.status(201).json({ message: "Owner created successfully", ownerId: createdOwner._id });
        } catch (error) {
            console.error("Error creating owner:", error);
            res.status(500).send("An error occurred while creating the owner.");
        }
    });
}

router.get("/dashboard", isLoggedin, async function(req, res) {
    if (req.user.role !== 'owner') {
        req.flash("error", "Access denied. Owner privileges required.");
        return res.redirect("/");
    }
    try {
        const products = await Product.find();
        res.render("ownerDashboard", { 
            products: products,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        req.flash("error", "An error occurred while fetching products");
        res.redirect("/");
    }
});

router.get("/admin", isLoggedin, function(req, res) {
    if (req.user.role !== 'owner') {
        req.flash("error", "Access denied. Owner privileges required.");
        return res.redirect("/");
    }
    res.render("createproducts", { success: req.flash('success') || '' });
});

module.exports = router;