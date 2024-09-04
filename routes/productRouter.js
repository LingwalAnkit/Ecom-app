const express = require('express');
const router = express.Router();
const productModels = require('../models/productModels');
const path = require('path');
const upload = require("../config/multerConfig")

router.post("/createProducts", upload.single("image"), async function(req, res) {
    console.log("Received form data:", req.body);
    try {
        let {image, name, price, discount,  panelcolor, textcolor , category} = req.body;
        
        let createdProduct = await productModels.create({
            name,
            image: req.file.buffer, 
            price,
            discount,
            panelcolor,
            textcolor,
            category
        });

        req.flash('success', 'Product created successfully');
        res.redirect("/owners/admin");
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', 'Failed to create product');
        res.redirect("/owners/admin");
    }
});

router.get("/edit/:id", async function(req, res) {
    try {
        const product = await productModels.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect("/owners/dashboard");
        }
        res.render('editProduct', { product });
    } catch (error) {
        console.error('Error fetching product:', error);
        req.flash('error', 'Failed to fetch product details');
        res.redirect("/owners/dashboard");
    }
});

// Update Product Route
router.post("/update/:id", upload.single("image"), async function(req, res) {
    try {
        const { name, price, discount, panelcolor, textcolor, category } = req.body;
        let updateData = { name, price, discount, panelcolor, textcolor, category };

        // Update the image if a new one is uploaded
        if (req.file) {
            updateData.image = req.file.buffer;
        }

        await productModels.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success', 'Product updated successfully');
        res.redirect("/owners/dashboard");
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error', 'Failed to update product');
        res.redirect("/owners/dashboard");
    }
});

// Delete Product Route
router.get("/delete/:id", async function(req, res) {
    try {
        await productModels.findByIdAndDelete(req.params.id);
        req.flash('success', 'Product deleted successfully');
        res.redirect("/owners/dashboard");
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error', 'Failed to delete product');
        res.redirect("/owners/dashboard");
    }
});

router.get('/shop', async function(req, res) {
    try {
        const products = await productModels.find();
        res.render('shop', { products: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('An error occurred while fetching products');
    }
});

module.exports = router;