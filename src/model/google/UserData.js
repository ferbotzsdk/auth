const joi = require('joi')

const GoogleUserData = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().allow(''),
    email: joi.string().email().required(),
    userId: joi.string().required(),
    picture: joi.string().uri(),
    name: joi.string().required(),
})
    .rename('given_name', 'firstName', { ignoreUndefined: true })
    .rename('family_name', 'lastName', { ignoreUndefined: true })
    .rename('sub', 'userId', { ignoreUndefined: true })
    .prefs({ stripUnknown: true });

module.exports.googleUserData = GoogleUserData;