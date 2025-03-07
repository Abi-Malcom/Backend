const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Prevent duplicate usernames
    },
    email: {
        type: String,
        required: true,
        unique: true, // Prevent duplicate emails
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: '',
    },
    language:{
        type:String,
        default:'English',
    },
    address:{
        type:String,
        default:'',
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
