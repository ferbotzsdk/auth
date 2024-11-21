const joi = require('joi')

const SignUpBody = joi.object({
    idToken : joi.string().required(),
    // role : joi.string().valid('OWNER', 'ADMIN', 'EDITOR', 'USER').required(),
    deviceName : joi.string().min(3).max(25).required(),
    deviceModel : joi.string().min(3).max(45).required()
})

module.exports.googleSignUpBodyModel = SignUpBody