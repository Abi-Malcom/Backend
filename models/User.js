const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true, // Ensures mobile numbers are unique
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

// Remove email index if it exists (to prevent duplicate key errors)
User.collection.dropIndex("email_1").catch(err => {
    if (err.codeName !== 'IndexNotFound') {
        console.error("Error removing email index:", err);
    }
});

module.exports = User;
