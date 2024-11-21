const sqlCon = require("../../../src/app").sqlConnection

//google  user

async function createUserWithGoogleAuth(googleUser) {
    const values = [googleUser.userId, googleUser.email];
    const createUserQuery = `
    INSERT INTO auth (authMedium, role, authMediumId, authMediumUserName)
    VALUES ("google","USER", ?, ?) ;
`;
    return new Promise((resolve, reject) => {
        sqlCon.query(createUserQuery, values, (error, res) => {
            if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    // user already exist
                    reject({message : "User Already Exists"})
                } else {
                    // couldn't create user
                    reject({message : error.message})
                }
            } else {
                resolve(res.insertId);
            }
        });
    });
}

async function createOwnerWithGoogleAuth(googleUser) {
    const values = [googleUser.userId, googleUser.email];
    const checkOwnerQuery = `
        SELECT COUNT(*) AS ownerCount 
        FROM auth 
        WHERE role = "OWNER" FOR UPDATE;
    `;
    const createOwnerQuery = `
        INSERT INTO auth (authMedium, role, authMediumId, authMediumUserName)
        VALUES ("google", "OWNER", ?, ?);
    `;

    return new Promise((resolve, reject) => {
        sqlCon.beginTransaction(err => {
            if (err) return reject({ message: err.message });

            sqlCon.query(checkOwnerQuery, (error, results) => {
                if (error) {
                    return sqlCon.rollback(() => reject({ message: error.message }));
                }

                if (results[0].ownerCount > 0) {
                    return sqlCon.rollback(() => reject({ message: "An owner already exists" }));
                }

                sqlCon.query(createOwnerQuery, values, (insertError, res) => {
                    if (insertError) {
                        return sqlCon.rollback(() => reject({ message: insertError.message }));
                    }

                    sqlCon.commit(commitErr => {
                        if (commitErr) {
                            return sqlCon.rollback(() => reject({ message: commitErr.message }));
                        }
                        resolve(res.insertId);
                    });
                });
            });
        });
    });
}


async function getGoogleUser(googleUser){
    const values = [googleUser.userId]
    const getUserQuery = "SELECT userId FROM auth WHERE authMediumId=?;"
    return new Promise((resolve, reject) => {
        sqlCon.query(getUserQuery, values, (error, res) => {
            if (error) {
                reject({message : error.message});
            }else {
                if (res.length === 0){
                    reject({message : "User doesn't exist"});
                }else{
                    resolve(res[0].userId)
                }
            }
        })
    })
}

async function addRefreshToken(userId,newRefreshToken,oldRefreshToken,sessionId) {
    const values = [userId ,newRefreshToken,oldRefreshToken,sessionId]
    const addRefreshQuery = "INSERT INTO refresh (userId , refreshToken , generatedAfter,sessionId) VALUES (?,?,?,?);"
    return new Promise((resolve, reject) => {
        sqlCon.query(addRefreshQuery, values, (error, res) => {
            if (error) {
                reject({message : error.message});
            }else {
                resolve(res.insertId);
            }
        })
    })
}

async function addSession(deviceName,deviceModel) {
    const values = [deviceName , deviceModel]
    const addSessionQuery = "INSERT INTO session (deviceName , deviceModel) VALUES (?,?);"
    return new Promise((resolve, reject) => {
        sqlCon.query(addSessionQuery, values, (error, res) => {
            if (error) {
                reject({message : error.message});
            }else {
                resolve(res.insertId);
            }
        })
    })
}

async function refreshTokenExist(userId, refreshToken) {
    const values = [userId, refreshToken];
    const query = "SELECT COUNT(*) AS count FROM refresh WHERE userId = ? AND refreshToken = ?;";

    return new Promise((resolve, reject) => {
        sqlCon.query(query, values, (error, res) => {
            if (error) {
                reject({ message: error.message });
            } else {
                if (res[0].count > 0){
                    resolve(true)
                }else {
                    reject({ message: "token not found" });
                }
            }
        });
    });
}

async function sessionExist(userId,sessionId,refreshToken){
    const values = [userId,parseInt(sessionId),refreshToken]
    const getAllRefreshTokenQuery = "SELECT COUNT(*) AS count FROM refresh WHERE userId = ? AND sessionId = ? AND refreshToken != ?;"
    return new Promise((resolve, reject) => {
        sqlCon.query(getAllRefreshTokenQuery, values, (error, res) => {
            if (error) {
                reject({message : error.message})
            }else {
                if (res[0].count > 0){
                    resolve(true)
                }else {
                    reject({ message: "session not found" });
                }
            }
        })
    })
}

async function deleteOldToken(userId, refreshToken) {
    const values = [userId, refreshToken];
    const selectQuery = "SELECT generatedAfter FROM refresh WHERE userId = ? AND refreshToken = ?;"
    const generatedAfterRows = await new Promise((resolve, reject) => {
        sqlCon.query(selectQuery, values, (error, results) => {
            if (error) {
                reject({ message: error.message });
            } else {
                resolve(results.map(row => row.generatedAfter));
            }
        });
    });
    if (generatedAfterRows.length > 0) {
        const deleteQuery = "DELETE FROM refresh WHERE userId = ? AND refreshToken IN (?);"
        await new Promise((resolve, reject) => {
            sqlCon.query(deleteQuery, [userId,generatedAfterRows], (error) => {
                if (error) {
                    reject({ message: error.message });
                } else {
                    resolve({ message: "Deleted Successfully" });
                }
            });
        });
    }
    return { message: "Deleted Successfully" };
}


async function deleteNewUnUsedToken(userId, refreshToken) {
    const values = [userId,refreshToken]
    const deleteQuery = "DELETE FROM refresh WHERE userId = ? AND generatedAfter = ?;"
    return new Promise((resolve, reject) => {
        sqlCon.query(deleteQuery, values, (error) => {
            if (error) {
                reject({ message: error.message });
            } else {
                resolve("Deleted Successfully");
            }
        });
    });
}

async function deleteOldTokens(sessionId){
    const deleteQuery = "DELETE FROM session WHERE id = ?;"
    return new Promise((resolve, reject) => {
        sqlCon.query(deleteQuery, [sessionId], (error) => {
            if (error) {
                reject({ message: error.message });
            }else {
                resolve("Deleted Successfully");
            }
        })
    })
}

async function getAllSessions(userId){
    const selectQuery = "SELECT * FROM session WHERE id IN (SELECT sessionId FROM refresh WHERE userId = ?);"
    return new Promise((resolve, reject) => {
        sqlCon.query(selectQuery, [userId], (error,results) => {
            if (error) {
                reject({ message: error.message });
            }else {
                resolve(results);
            }
        })
    })
}

module.exports.createUserWithGoogleAuth = {createUserWithGoogleAuth}
module.exports.createOwnerWithGoogleAuth = {createOwnerWithGoogleAuth}
module.exports.getGoogleUser = {getGoogleUser}
module.exports.addRefreshToken = {addRefreshToken}
module.exports.refreshTokenExist = {refreshTokenExist}
module.exports.deleteOldToken = {deleteOldToken}
module.exports.deleteNewUnUsedToken = {deleteNewUnUsedToken}
module.exports.deleteOldTokens = {deleteOldTokens}
module.exports.addSession = {addSession}
module.exports.getAllSessions = {getAllSessions}
module.exports.sessionExist = {sessionExist}
