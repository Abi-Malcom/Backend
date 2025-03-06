/* eslint-disable no-trailing-spaces */
/* eslint-disable eol-last */
require('dotenv').config(); // Load environment variables

const bodyParser = require('body-parser');
const mongoose = require('mongoose');   
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000
const mongoUrl = process.env.MONGO_URI; // Load MongoDB URI from .env

require('./models/User');
const requireToken = require('./middleware/requireToken');
const authUser = require('./routes/authUser');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(authUser);

// Connect to MongoDB
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
    console.log('Error:', err);
});

// Protected Route
app.get('/', requireToken, (req, res) => {
    res.send(`Your email is ${req.user.email}`);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
