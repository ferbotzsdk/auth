function notNullOrEmpty(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

module.exports.nnoe = notNullOrEmpty