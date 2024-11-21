console.log("init MonoDateAuth");
require('dotenv').config();

// api setup
const express = require('express');
const app = express();
const port = process.env.AUTH_PORT || 3000;
app.use(express.json());
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

// MySQL setup
const mySql = require('mysql');

const initialCon = mySql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER_NAME,
    password: process.env.SQL_PWD,
});

const dbCon = mySql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER_NAME,
    password: process.env.SQL_PWD,
    database: process.env.SQL_DATABASE,
});

// Database and tables schema
const databaseName = process.env.SQL_DATABASE;
const tableSchemas = [
    `CREATE TABLE IF NOT EXISTS auth (
        userId INT NOT NULL AUTO_INCREMENT,
        authMedium ENUM('google') NOT NULL,
        role ENUM('OWNER','ADMIN','EDITOR','USER') NOT NULL,
        authMediumId VARCHAR(255) DEFAULT NULL,
        authMediumUserName VARCHAR(255) NOT NULL UNIQUE,
        PRIMARY KEY (userId)
    );`,
    `CREATE TABLE IF NOT EXISTS refresh (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        refreshToken TEXT NOT NULL,
        generatedAfter TEXT DEFAULT NULL,
        sessionId INT NOT NULL,
        PRIMARY KEY (id),
        KEY sessionId (sessionId)
    );`,
    `CREATE TABLE IF NOT EXISTS SESSION (
        id INT NOT NULL AUTO_INCREMENT,
        deviceName VARCHAR(100) NOT NULL,
        deviceModel VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
    );`
];

// Check and initialize database and tables
function initDbAndTables() {
    initialCon.connect(err => {
        if (err) throw err;
        console.log("Connected to MySQL for setup.");

        // Check if database exists or create it
        initialCon.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`, err => {
            if (err) throw err;
            console.log(`Database '${databaseName}' ensured.`);

            // Connect to the database and ensure tables exist
            dbCon.connect(err => {
                if (err) throw err;
                console.log(`Connected to database '${databaseName}'.`);

                tableSchemas.forEach(schema => {
                    dbCon.query(schema, err => {
                        if (err) throw err;
                        console.log("Table ensured:", schema.split(' ')[2]); // Logs the table name
                    });
                });
            });
        });
    });
}

// Run initialization
initDbAndTables();

module.exports.sqlConnection = dbCon;
app.use("/google" , require("./route/GoogleAuthRouter").googleAuthRouter)
app.use("/token" , require("./route/TokenRouter").tokenRouter)
app.use("/session" , require("./route/SessionRouter").sessionRouter)
