const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Plant = require('../models/Plants');
const User = require('../models/User'); // Ensure this model exists

dotenv.config(); // Load environment variables

const jwtKey = process.env.JWT_SECRET || 'your_jwt_secret_key';
const otpStore = {}; // Temporary OTP storage

// ✅ Ensure MongoDB is connected before running queries
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.error('MongoDB Connection Error:', err));
}

// ✅ Helper function to get a dynamic Mongoose model
function getDynamicModel(collectionName) {
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]; // Return existing model
    }
    return mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
}

// ✅ Fetch products from all collections OR a specific collection
router.get("/products", async (req, res) => {
    try {
        const { category } = req.query;
        const collections = ["Animal-Products", "Bioproducts", "Crop-Products", "Value-Added-Products"];

        if (mongoose.connection.readyState !== 1) {
            console.error("MongoDB is not connected!");
            return res.status(500).json({ error: "Database connection error" });
        }

        if (category) {
            if (!collections.includes(category)) {
                return res.status(400).json({ error: "Invalid category name" });
            }

            const DynamicModel = getDynamicModel(category);
            const products = await DynamicModel.find({}).lean();
            console.log(`Fetched ${category} products:`, products);
            return res.json({ [category]: products });
        }

        // Fetch all collections
        const data = {};
        for (const collectionName of collections) {
            const DynamicModel = getDynamicModel(collectionName);
            data[collectionName] = await DynamicModel.find({}).lean();
        }

        console.log("Fetched all products:", data);
        res.json(data);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Error fetching products" });
    }
});

// ✅ Fetch all plants from MongoDB
router.get('/plants', async (req, res) => {
    try {
        const plants = await Plant.find({}).lean();
        console.log("Fetched Plants:", plants);
        res.json(plants);
    } catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({ error: 'Failed to fetch plants' });
    }
});

// ✅ Fetch Diseases from MongoDB
router.get('/diseases', async (req, res) => {
    try {
        const DiseaseModel = getDynamicModel("Diseases");
        const diseases = await DiseaseModel.find({}).limit(10).lean(); // Fetch full document
        console.log("Fetched Diseases:", JSON.stringify(diseases, null, 2));
        res.json(diseases);
    } catch (error) {
        console.error('Error fetching diseases:', error);
        res.status(500).json({ error: 'Failed to fetch diseases' });
    }
});

// ✅ Fetch Pests from MongoDB
router.get('/pests', async (req, res) => {
    try {
        const PestModel = getDynamicModel("Pests");
        const pests = await PestModel.find({}).limit(10).lean();
        console.log("Fetched Pests:", pests);
        res.json(pests);
    } catch (error) {
        console.error('Error fetching pests:', error);
        res.status(500).json({ error: 'Failed to fetch pests' });
    }
});

// ✅ User Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Weak password format' });
        }

        // Check if a user with the same email or name exists
        const existingUser = await User.findOne({ $or: [{ email }, { name }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Username already exists' });
        }

        // Hash the password and create a new user document
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Create a token and send response
        const token = jwt.sign({ userId: user._id }, jwtKey, { expiresIn: '7d' });
        res.status(201).json({ 
            message: 'User registered successfully', 
            token, 
            user: { id: user._id, name, email } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Email:", email);
      console.log("Password:", password);
      
      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      // Get the user model dynamically (ensure getDynamicModel is correctly defined)
      const User = getDynamicModel("users");
      // Find user by email (no username support)
      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      // Trim the input password and log for debugging
      const inputPassword = password.trim();
      console.log("Input Password:", inputPassword);
      console.log("Stored Hash:", user.password);
  
      // Validate password using bcrypt.compare
      const isPasswordValid = await bcrypt.compare(inputPassword, user.password);
      console.log("Password valid:", isPasswordValid);
  
      // Create JWT token
      const token = jwt.sign({ userId: user._id }, jwtKey, { expiresIn: "7d" });
  
      // Send success response with token and user details
      res.status(200).json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email }
      });
    } catch (error) {
      console.error("Error in /signin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// ✅ Middleware for authentication
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

        const decoded = jwt.verify(token, jwtKey);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// ✅ User Profile API
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('name email').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

module.exports = router;
