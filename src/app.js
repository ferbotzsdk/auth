console.log("init MonoDateAuth");
require('dotenv').config();

// api setup
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

// mySql setup
const  mySql = require('mysql');
const con = mySql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER_NAME,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DATABASE,
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

module.exports.sqlConnection = con;
app.use("/google" , require("./route/GoogleAuthRouter").googleAuthRouter)
app.use("/token" , require("./route/TokenRouter").tokenRouter)
app.use("/session" , require("./route/SessionRouter").sessionRouter)
