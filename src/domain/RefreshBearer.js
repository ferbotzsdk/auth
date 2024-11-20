const { generateRefreshToken } = require("../middleware/jwt/JwtGenerator").generateRefreshToken
const { generateBearerToken } = require("../middleware/jwt/JwtGenerator").generateBearerToken
const { addRefreshToken } = require("../service/sql/AuthDb").addRefreshToken

async function createRefreshAndBearer(userId,oldRefreshToken,sessionId){
    try{
        const [ newRefreshToken, bearerToken ] = await Promise.all([generateRefreshToken(userId,sessionId),generateBearerToken(userId,sessionId)])
        await addRefreshToken(userId,newRefreshToken,oldRefreshToken,sessionId);
        return {refreshToken: newRefreshToken, bearerToken: bearerToken};
    }catch(error) {
        return null
    }
}

module.exports.createRefreshAndBearer = {createRefreshAndBearer}