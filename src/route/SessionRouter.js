const {refreshTokensBody: refreshTokenBody} = require("../model/token/RefreshTokensBody");
const router = require('express').Router();
const { getAllSessions } = require("../service/sql/AuthDb").getAllSessions
const { deleteOldTokens } = require("../service/sql/AuthDb").deleteOldTokens
const { decodeJwt,validateAuth } = require('ferbotz-certify');
const { sessionExist } = require("../service/sql/AuthDb").sessionExist
const { refreshTokenExist } = require("../service/sql/AuthDb").refreshTokenExist


router.get('/', async (req, res) => {
    try {
        const authData = await validateAuth(req.headers['authorization'])
        try {
            const sessions = await getAllSessions(authData.userId);
            return res.status(200).json(sessions)
        }catch (error){
            res.status(500).json({message : error.message});
        }
    }catch (error) {
        res.status(error.code).send({message: error.message});
    }
})

router.delete("/revoke/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId;
    if (sessionId){
        const { error , value : {refreshToken , bearerToken}} = refreshTokenBody.validate(req.body);
        if (!error) {
            try{
                const decodedRefreshToken = await decodeJwt(refreshToken)
                const decodedBearerToken = await decodeJwt(bearerToken)
                if (decodedRefreshToken.userId === decodedBearerToken.userId && decodedRefreshToken.sessionId === decodedBearerToken.sessionId) {
                    try{
                        await refreshTokenExist(decodedRefreshToken.userId , refreshToken)
                        try {
                            await sessionExist(decodedRefreshToken.userId , sessionId , refreshToken)
                            try {
                                await deleteOldTokens(sessionId)
                                res.status(200).json({message : "session revoked successfully"});
                            }catch (error){
                                res.status(500).json({message : 'server error'});
                            }
                        }catch (error){
                            res.status(400).json({
                                message : "session doesn't exist",
                                cause : "it could be because you try to revoke your own session"
                            });
                        }
                    }catch (error){
                        res.status(401).json({message : 'wrong token, either expired or already revoked'});
                    }
                }else {
                    res.status(401).json({message : 'token mismatch, duplicate date'});
                }
            }catch (error){
                res.status(401).json({message : "wrong token" + error.message});
            }
        }else {
            res.status(400).json({message : error.message});
        }
    }else {
        res.status(400).json({message : 'No sessionId provided.'});
    }
})


module.exports.sessionRouter = router;