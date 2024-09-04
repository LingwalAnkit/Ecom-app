const express = require("express")
const router = express.Router()
const isLoggedin = require("../middelware/loggedMiddelware")
const userModel = require("../models/userModel")
const productModels = require("../models/productModels")
const cartModel = require("../models/cartModel")
const db = require("../config/database");

router.get("/", (req,res)=>{
    let error = req.flash("error")
    res.render("index" , {error , loggedin : false})
})

router.get("/shop", isLoggedin, async (req, res) => {
    console.log("Entering shop route");
    let success = req.flash("success");
    let error = req.flash("error");
    
    try {
        const products = await productModels.find({}).sort('-createdAt');
        console.log("Products fetched:", products);
        res.render("shop", { success, error, products });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.render("shop", { success, error: "Failed to fetch products", products: [] });
    }
});

router.get("/addtocart/:productid", isLoggedin, async (req, res) => {
    try {
        let user = await userModel.findOne({email: req.user.email});
        if (!user) {
            throw new Error("User not found");
        }
        
        // Check if the product exists
        const product = await productModels.findById(req.params.productid);
        if (!product) {
            throw new Error("Product not found");
        }
        
        // Find or create cart for the user
        let cart = await cartModel.findOne({user: user._id});
        if (!cart) {
            cart = new cartModel({user: user._id, items: []});
        }
        
        // Check if product is already in cart
        const cartItemIndex = cart.items.findIndex(item => item.product.toString() === product._id.toString());
        
        if (cartItemIndex > -1) {
            // Product exists, increase quantity
            cart.items[cartItemIndex].quantity += 1;
        } else {
            // Product doesn't exist, add new item
            cart.items.push({product: product._id, quantity: 1});
        }
        
        await cart.save();
        
        console.log(`Product ${product._id} added to cart for user ${user.email}`);
        req.flash("success", "Added to cart");
    } catch (error) {
        console.error("Error adding to cart:", error);
        req.flash("error", "Failed to add to cart: " + error.message);
    }
    res.redirect("/shop");
});

router.post("/increasequantity/:itemId", isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email});
        if (!user) {
            throw new Error("User not found");
        }
        
        let cart = await cartModel.findOne({user: user._id});
        if (!cart) {
            throw new Error("Cart not found");
        }
        
        const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
        
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
            await cart.save();
        } else {
            req.flash("error", "Item not found in cart");
        }
    } catch (error) {
        console.error("Error increasing quantity:", error);
        req.flash("error", "Failed to increase quantity: " + error.message);
    }
    res.redirect("/cart");
});

// Add this new route for decreasing item quantity
router.post("/decreasequantity/:itemId", isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email});
        if (!user) {
            throw new Error("User not found");
        }
        
        let cart = await cartModel.findOne({user: user._id});
        if (!cart) {
            throw new Error("Cart not found");
        }
        
        const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
        
        if (itemIndex > -1) {
            if (cart.items[itemIndex].quantity > 1) {
                cart.items[itemIndex].quantity -= 1;
                await cart.save();
            } else {
                // Remove the item if quantity would become 0
                cart.items.splice(itemIndex, 1);
                await cart.save();
                req.flash("success", "Item removed from cart");
            }
        } else {
            req.flash("error", "Item not found in cart");
        }
    } catch (error) {
        console.error("Error decreasing quantity:", error);
        req.flash("error", "Failed to decrease quantity: " + error.message);
    }
    res.redirect("/cart");
});

router.post("/removefromcart/:itemId", isLoggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email});
        if (!user) {
            throw new Error("User not found");
        }
        
        let cart = await cartModel.findOne({user: user._id});
        if (!cart) {
            throw new Error("Cart not found");
        }
        
        // Find the index of the item to remove
        const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
        
        if (itemIndex > -1) {
            // Remove the item from the cart
            cart.items.splice(itemIndex, 1);
            await cart.save();
            req.flash("success", "Item removed from cart");
        } else {
            req.flash("error", "Item not found in cart");
        }
    } catch (error) {
        console.error("Error removing from cart:", error);
        req.flash("error", "Failed to remove item from cart: " + error.message);
    }
    res.redirect("/cart");
});

// Update the existing cart route to pass success and error messages to the view
router.get("/cart", isLoggedin, async function(req, res) {
    try {
        let user = await userModel.findOne({email: req.user.email});
        let cart = await cartModel.findOne({user: user._id}).populate('items.product');

        let success = req.flash("success");
        let error = req.flash("error");

        if (cart && cart.items.length > 0) {
            // Filter out any items where the product is null
            cart.items = cart.items.filter(item => item.product !== null);

            const latestProduct = cart.items.length > 0 ? cart.items[cart.items.length - 1].product : null;

            const bill = cart.items.reduce((total, item) => {
                return total + (item.product.price * item.quantity) - (item.product.discount || 0);
            }, 20); // Adding 20 for platform fee

            res.render("cart", {user, cart, latestProduct, bill, success, error});
        } else {
            res.render("cart", {user, cart: null, latestProduct: null, bill: 0, success, error});
        }
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send("An error occurred while fetching your cart");
    }
});


module.exports = router;