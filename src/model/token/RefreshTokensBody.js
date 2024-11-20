const joi = require('joi')

const refreshTokensBodyModel = joi.object({
    refreshToken: joi.string().required(),
    bearerToken: joi.string().required()
})

module.exports.refreshTokensBody = refreshTokensBodyModel