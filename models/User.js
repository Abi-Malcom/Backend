const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        
    },
    password: {
        type: String,
        required: true,
        // Removed unique: true, as multiple users might have the same password (hashed).
    },
    mobile: {
        type: String,
        required: true,
        unique: true, // Mobile numbers should be unique
    },
    language: {
        type: String,
        default: 'English',
    },
    address: {
        type: String,
        default: '',
    }
});



const User = mongoose.model('User', userSchema);
module.exports = User;
