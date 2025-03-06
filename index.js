
require('dotenv').config(); // Load environment variables

const bodyParser = require('body-parser');
const mongoose = require('mongoose');   
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; 
const mongoUrl = process.env.MONGO_URI; 
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
app.get('/', (req, res) => {
    res.send('Welcome to the API - No authentication needed');
});

app.get("/favicon.ico", (req, res) => res.status(204).end());


// Start Server
module.exports = app; //
