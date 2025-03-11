const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Plant = require('../models/Plants');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
dotenv.config(); 

const jwtKey = process.env.JWT_SECRET;


if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.error('MongoDB Connection Error:', err));
}

// Helper function to get a dynamic Mongoose model
function getDynamicModel(collectionName) {
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]; // Return existing model
    }
    return mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
}

// Fetch products from all collections OR a specific collection
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

// Fetch all plants from MongoDB
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

// Fetch Diseases from MongoDB
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


//  Fetch Pests from MongoDB
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

router.get('/value-added-products', async (req, res) => {
    try {
        const ValueAddedProducts = getDynamicModel("Value-Added-Products");
        const valueAddedProducts = await ValueAddedProducts.find({}).limit(10).lean();
        console.log("Fetched Value Added Products:", valueAddedProducts);
        res.json(valueAddedProducts);
    } catch (error) {
        console.error('Error fetching value-added-products:', error);
        res.status(500).json({ error: 'Failed to fetch value-added-products' });
    }
}
);

router.post('/signup', async (req, res) => {
    try {
        const { name, mobile, password, address, language } = req.body;

        // Validate Required Fields
        if (!name || !mobile || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate Mobile Number Format (Assuming 10-digit number)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number format' });
        }

        // Validate Password Strength (Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special Char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: 'Weak password: Must have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.' 
            });
        }

        // Check if a user with the same mobile number or name exists
        const existingUser = await User.findOne({ $or: [{ mobile }, { name }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Mobile number or Username already exists' });
        }

        // Hash Password Before Saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a New User
        const user = new User({ name, mobile, password: hashedPassword, address, language });
        await user.save();

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id }, jwtKey, { expiresIn: '7d' });

        // Send Success Response with Token
        res.status(201).json({ 
            message: 'User registered successfully', 
            token, 
            user: { id: user._id, name, mobile, address, language } 
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { mobile, password } = req.body;

        // Validate Required Fields
        if (!mobile || !password) {
            return res.status(400).json({ error: 'Mobile number and password are required' });
        }

        // Find User by Mobile Number
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare Password using Bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id }, jwtKey, { expiresIn: '7d' });

        // Send Success Response with Token
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, mobile: user.mobile }
        });

    } catch (error) {
        console.error('Error in /signin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/user', authenticate, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user data' });
    }
});

router.patch("/update", authenticate, async (req, res) => {
    try {
        const { name, mobile, password, language, address } = req.body;
        const userId = req.user.userId; // Extract user ID from decoded JWT token

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (mobile) user.mobile = mobile;
        if (language) user.language = language;
        if (address) user.address = address;

        // Hash new password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // Save updated user data
        await user.save();

        res.status(200).json({ 
            message: "User profile updated successfully", 
            user: { id: user._id, name: user.name, mobile: user.mobile, phone: user.phone, language: user.language, address: user.address }
        });

    } catch (error) {
        console.error("Error in /update:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});




module.exports = router;
