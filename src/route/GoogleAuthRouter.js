const router = require("express").Router();
require('dotenv').config();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client();

const googleSignUpBodyModel = require("../model/google/SignUpBody").googleSignUpBodyModel
const googleUserDataModel = require("../model/google/UserData").googleUserData
const { getGoogleUser } = require("../service/sql/AuthDb").getGoogleUser
const { createUserWithGoogleAuth } = require("../service/sql/AuthDb").createUserWithGoogleAuth
const { createOwnerWithGoogleAuth } = require("../service/sql/AuthDb").createOwnerWithGoogleAuth
const { addSession } = require("../service/sql/AuthDb").addSession
const { createRefreshAndBearer } = require("../domain/RefreshBearer").createRefreshAndBearer

router.post("/signup", async (req, res) => {
    const {error , value : { idToken , deviceName , deviceModel }} = googleSignUpBodyModel.validate(req.body);
    if (!error) {
        const {user, error} = await verifyGoogle(idToken)
        if (user) {
            try {
                const {userId,role} = await createUserWithGoogleAuth(user)
                const sessionId = await addSession(deviceName,deviceModel)
                const tokens = await createRefreshAndBearer(userId,null,sessionId,role)
                if(tokens){
                    res.status(200).json({
                        refreshToken : tokens.refreshToken,
                        bearerToken : tokens.bearerToken,
                        sessionId : sessionId,
                        role: role
                    })
                }else {
                    res.status(500).json({message : "Server error, failed to create tokens"})
                }
            }catch(error) {
                res.status(403).json(error)
            }
        }else {
            res.status(403).json(error)
        }
    }else {
        res.status(400).json({message: "error " + error.message});
    }
})

router.post("/signup/owner", async (req, res) => {
    const {error , value : { idToken , deviceName , deviceModel }} = googleSignUpBodyModel.validate(req.body);
    if (!error) {
        const {user, error} = await verifyGoogle(idToken)
        if (user) {
            try {
                const {userId,role} = await createOwnerWithGoogleAuth(user)
                const sessionId = await addSession(deviceName,deviceModel)
                const tokens = await createRefreshAndBearer(userId,null,sessionId,role)
                if(tokens){
                    res.status(200).json({
                        refreshToken : tokens.refreshToken,
                        bearerToken : tokens.bearerToken,
                        sessionId : sessionId,
                        role: role
                    })
                }else {
                    res.status(500).json({message : "Server error, failed to create tokens"})
                }
            }catch(error) {
                res.status(403).json(error)
            }
        }else {
            res.status(403).json(error)
        }
    }else {
        res.status(400).json({message: "error " + error.message});
    }
})


router.post("/signin", async (req, res) => {
    const { error , value : { idToken , deviceName , deviceModel } } = googleSignUpBodyModel.validate(req.body);
    if (!error) {
        const {user, error} = await verifyGoogle(idToken)
        if (user) {
            try{
                const {userId,role} = await getGoogleUser(user)
                const sessionId = await addSession(deviceName,deviceModel)
                const tokens = await createRefreshAndBearer(userId,null,sessionId,role)
                if(tokens){
                    res.status(200).json({
                        refreshToken : tokens.refreshToken,
                        bearerToken : tokens.bearerToken,
                        sessionId : sessionId,
                        role: role
                    })
                }else {
                    res.status(500).json({message: "Server error, failed to create tokens"})
                }
            }catch(error) {
                res.status(403).json(error)
            }
        }else {
            res.status(403).json({message: "error " + error.message});
        }
    }else {
        res.status(400).json(error);
    }
})

async function verifyGoogle(idToken) {
    try {
        const audience = process.env.AUTH_GOOGLE_CLIENT_IDS.split(",")
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: audience
        });
        const payload = ticket.getPayload();
        const googleUserData = googleUserDataModel.validate(payload);
        if (!googleUserData.error) {
            return {user:googleUserData.value , error:null};
        }else {
            return {user:null , error: {message : googleUserData.error.message}};
        }
    } catch (error) {
        return {user:null , error: {message : error.message}};
    }
}


module.exports.googleAuthRouter = router;