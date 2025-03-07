const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const jwtKey = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
        }

        const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
        console.log("Extracted Token:", token); // Debugging log

        const decoded = jwt.verify(token, jwtKey);
        req.user = decoded; // Attach user data to request

        next(); // Proceed to next middleware
    } catch (error) {
        console.error("JWT Authentication Error:", error.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

module.exports = authenticate;
