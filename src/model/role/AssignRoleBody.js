const joi = require('joi')

const AssignRoleBody = joi.object({
    authMediumUserName : joi.string().required(),
    role : joi.string().valid('ADMIN', 'EDITOR', 'USER').required(),
    bearerToken: joi.string().required()
})

module.exports.assignRoleBody = AssignRoleBody