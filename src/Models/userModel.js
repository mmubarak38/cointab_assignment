const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        min: 8,
        max: 15,
        //required: true
    },
    confirmPassword: {
        type: String,
        min: 8,
        max: 15,
        //required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)