const router = require('express').Router();
const { decodeJwt } = require('jwtdecode');
const { decodeJwtFlexible } = require('jwtdecode');
const refreshTokenBody = require("../model/token/RefreshTokensBody").refreshTokensBody
const { refreshTokenExist } = require("../service/sql/AuthDb").refreshTokenExist
const { deleteOldToken } = require("../service/sql/AuthDb").deleteOldToken
const { deleteNewUnUsedToken } = require("../service/sql/AuthDb").deleteNewUnUsedToken
const { deleteOldTokens } = require("../service/sql/AuthDb").deleteOldTokens
const { createRefreshAndBearer } = require("../domain/RefreshBearer").createRefreshAndBearer


router.post('/decode', async (req, res) => {
    const token = req.body.token;
    if (!token) {
        res.status(400).json({message : 'No token provided'});
    }else {
        try {
            const decodedJwt = await decodeJwt(token);
            res.status(200).json(decodedJwt);
        }catch (err){
            res.status(401).json(err);
        }
    }
})

router.post("/refresh", async (req, res) => {
    const { error , value : {refreshToken , bearerToken}} = refreshTokenBody.validate(req.body);
    if (!error) {
        try{
            const decodedRefreshToken = await decodeJwt(refreshToken)
            const decodedBearerToken = await decodeJwtFlexible(bearerToken)
            if (decodedRefreshToken.userId === decodedBearerToken.userId && decodedRefreshToken.sessionId === decodedBearerToken.sessionId) {
                try{
                    await refreshTokenExist(decodedRefreshToken.userId , refreshToken)
                    try {
                        await deleteNewUnUsedToken(decodedRefreshToken.userId,refreshToken)
                        await deleteOldToken(decodedRefreshToken.userId,refreshToken)
                        const newTokens = await createRefreshAndBearer(decodedRefreshToken.userId,refreshToken,decodedRefreshToken.sessionId)
                        if(newTokens){
                            res.status(200).json({
                                refreshToken : newTokens.refreshToken,
                                bearerToken : newTokens.bearerToken,
                                userId: decodedRefreshToken.userId
                            })
                        }else {
                            res.status(500).json({message : "Failed to generate new Bearer Token"})
                        }
                    }catch (error){
                        res.status(500).json({message : "server error"})
                    }
                }catch (error){
                    res.status(403).json({message : 'wrong token, either expired or already revoked'});
                }
            }else {
                const decodedFlexibleRefreshToken = await decodeJwtFlexible(refreshToken)
                deleteOldTokens(decodedFlexibleRefreshToken.userId, decodedFlexibleRefreshToken.sessionId)
                res.status(403).json({message : 'token mismatch'});
            }
        }catch (error){
            res.status(403).json({message : error.message});
        }
    }else {
        res.status(400).json({message : error.message});
    }
})

router.delete("/logout", async (req, res) => {
    const { error , value : {refreshToken , bearerToken}} = refreshTokenBody.validate(req.body);
    if (!error) {
        try{
            const decodedRefreshToken = await decodeJwt(refreshToken)
            const decodedBearerToken = await decodeJwt(bearerToken)
            if (decodedRefreshToken.userId === decodedBearerToken.userId && decodedRefreshToken.sessionId === decodedBearerToken.sessionId) {
                try{
                    await refreshTokenExist(decodedRefreshToken.userId , refreshToken)
                    try {
                        await deleteOldTokens(decodedRefreshToken.sessionId)
                        res.status(200).json({message : "logged out successfully"});
                    }catch (error){
                        res.status(500).json({message : 'server error'});
                    }
                }catch (error){
                    res.status(401).json({message : 'wrong token, either expired or already revoked'});
                }
            }else {
                res.status(401).json({message : 'token mismatch'});
            }
        }catch (error){
            res.status(401).json({message : error.message});
        }
    }else {
        res.status(400).json({message : error.message});
    }
})

router.post("/acknowledge/refresh", async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
        try {
            const { userId } = await decodeJwt(refreshToken)
            try {
                await deleteOldToken(userId,refreshToken)
                res.status(200).json({message : "Successfully acknowledged"})
            }catch (error){
                res.status(500).json(error)
            }
        }catch (error) {
            console.log(error)
            res.status(401).json({message : "wrong token " + error.message});
        }
    }else {
        res.status(400).json({message : 'Refresh token not provided'});
    }
})

module.exports.tokenRouter = router;
