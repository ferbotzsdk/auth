
const express = require('express');
const mySql = require('mysql');
require('dotenv').config();

function initFerbotzAuth(config) {
    // Apply external configuration
    const {
        port = config.port,
        sqlHost = config.sqlHost,
        sqlUser = config.sqlUser,
        sqlPassword = config.sqlPassword,
        sqlDatabase = config.sqlDatabase,
    } = config;

    // Express app setup
    const app = config.express || express();
    app.use(express.json());

    // MySQL setup
    const initialCon = mySql.createConnection({
        host: sqlHost,
        user: sqlUser,
        password: sqlPassword,
    });

    const dbCon = mySql.createConnection({
        host: sqlHost,
        user: sqlUser,
        password: sqlPassword,
        database: sqlDatabase,
    });

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

    // Database initialization
    function initDbAndTables() {
        initialCon.connect(err => {
            if (err) throw err;
            console.log("Connected to MySQL for setup.");

            // Create database if not exists
            initialCon.query(`CREATE DATABASE IF NOT EXISTS ${sqlDatabase}`, err => {
                if (err) throw err;
                console.log(`Database '${sqlDatabase}' ensured.`);

                dbCon.connect(err => {
                    if (err) throw err;
                    console.log(`Connected to database '${sqlDatabase}'.`);

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

    // Initialize database
    initDbAndTables();

    // Setup routes
    app.use("/auth/google", require("./route/GoogleAuthRouter").googleAuthRouter);
    app.use("/auth/token", require("./route/TokenRouter").tokenRouter);
    app.use("/auth/session", require("./route/SessionRouter").sessionRouter);
    app.use("/auth/role", require("./route/RoleRouter").roleRouter);

    // Start server
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });

    return app;
}

// initFerbotzAuth({
//     port : process.env.AUTH_PORT || 3000,
//     sqlHost : process.env.AUTH_SQL_HOST,
//     sqlUser : process.env.AUTH_SQL_USER_NAME,
//     sqlPassword : process.env.AUTH_SQL_PWD,
//     sqlDatabase : process.env.AUTH_SQL_DATABASE,
// })

module.exports = { initFerbotzAuth };

