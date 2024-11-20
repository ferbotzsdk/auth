const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtPrivateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
const refreshExpiryTime = 10 * 24 * 60 * 60
const bearerExpiryTime = 2 * 60 * 60

async function generateRefreshToken(userId,sessionId) {
    return new Promise((resolve, reject) => {
        jwt.sign({ userId: userId , sessionId: sessionId}, jwtPrivateKey, { algorithm: 'RS256' , expiresIn: refreshExpiryTime }, function(error, token) {
            if(error){
                reject({message : error.message});
            }else {
                resolve(token);
            }
        });
    })
}

async function generateBearerToken(userId,sessionId) {
    return new Promise((resolve, reject) => {
        jwt.sign({ userId: userId , sessionId: sessionId}, jwtPrivateKey, { algorithm: 'RS256' , expiresIn: bearerExpiryTime }, function(error, token) {
            if(error){
                reject({message : error.message});
            }else {
                resolve(token);
            }
        });
    })
}

module.exports.generateRefreshToken = {generateRefreshToken};
module.exports.generateBearerToken = {generateBearerToken};