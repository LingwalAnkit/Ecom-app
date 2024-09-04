const mongoose = require("mongoose")
const dbgr = require("debug")("development:mongoose")
const config = require("config")

mongoose.connect(`${config.get("MONGODB_URI")}/scatch`)

.then(function(){
    console.log("Database connected")
})
.catch(function(err){
    console.log("Error:", err.message)
})

module.exports = mongoose.connection
