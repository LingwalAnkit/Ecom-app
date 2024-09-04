const mongoose = require("mongoose")

const ownerSchema = mongoose.Schema({
    name: String,
    email: String, 
    password: String,
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    }],
})

module.exports = mongoose.model("owner" , ownerSchema)