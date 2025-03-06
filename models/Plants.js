const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    imageUrl: { type: String, required: true },
}, { timestamps: true });

const Plant = mongoose.model('Plant', plantSchema, 'Crop-Products'); // Explicit collection name

module.exports = Plant;
