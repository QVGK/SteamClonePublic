const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    country: String,
    banned: Boolean,
    token: String,
})

module.exports = mongoose.model('Users', userSchema, 'Users')