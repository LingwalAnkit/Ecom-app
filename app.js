const express = require("express");
const path = require("path");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const db = require("./config/database");
const app = express();
const expressSession = require("express-session")
const flash = require("connect-flash")
require("dotenv").config()
const morgan = require('morgan');
const port = 3000;

const ownerRouter = require("./routes/ownerRouter");
const userRouter = require("./routes/userRouter")
const productRouter = require('./routes/productRouter');
const indexRouter = require("./routes/index")

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({extended:true}));
app.use(cookieparser());
app.use(express.static(path.join(__dirname, "public")));
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET
}))
app.use(flash())
app.set("view engine", "ejs");

app.use("/owners", ownerRouter);
app.use("/users" , userRouter)
app.use("/" , indexRouter)
app.use('/products', productRouter);


app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});