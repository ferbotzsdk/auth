const mExpress = require('express');
const mySql = require('mysql');
require('dotenv').config();
let sqlConnection = null;


function initFerbotzAuth(config) {

    const app = config.express || mExpress();
    app.use(mExpress.json());

    // MySQL setup
    const initialCon = mySql.createConnection({
        host: config.sqlHost,
        user: config.sqlUser,
        password: config.sqlPassword,
        port: config.sqlPort
    });

    sqlConnection = mySql.createConnection({
        host: config.sqlHost,
        user: config.sqlUser,
        password: config.sqlPassword,
        database: config.sqlDatabase,
        port: config.sqlPort
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
        `CREATE TABLE IF NOT EXISTS session (
            id INT NOT NULL AUTO_INCREMENT,
            deviceName VARCHAR(100) NOT NULL,
            deviceModel VARCHAR(255) NOT NULL,
            PRIMARY KEY (id)
        );`
    ];

    initialCon.connect(err => {
        if (err) throw err;
        console.log("Connected to MySQL for setup.");

        // Create database if not exists
        initialCon.query(`CREATE DATABASE IF NOT EXISTS ${config.sqlDatabase}`, err => {
            if (err) throw err;
            console.log(`Database '${config.sqlDatabase}' ensured.`);

            sqlConnection.connect(err => {
                if (err) throw err;
                console.log(`Connected to database '${config.sqlDatabase}'.`);

                tableSchemas.forEach(schema => {
                    sqlConnection.query(schema, err => {
                        if (err) throw err;
                        console.log("Table ensured:", schema.split(' ')[2]); // Logs the table name
                    });
                });
                // Setup routes
                app.use("/auth/google", require("./route/GoogleAuthRouter").googleAuthRouter);
                app.use("/auth/token", require("./route/TokenRouter").tokenRouter);
                app.use("/auth/session", require("./route/SessionRouter").sessionRouter);
                app.use("/auth/role", require("./route/RoleRouter").roleRouter);

                // Start server
                if(!config.express){
                    app.listen(config.port, () => {
                        console.log(`Listening on port ${config.port}`);
                    });
                }
            });
        });
    });

    return app;
}

module.exports = { 
    initFerbotzAuth, 
    get sqlConnection() { return sqlConnection; }
};

