/* eslint-disable semi */
/* eslint-disable eol-last */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtKey = process.env.JWT_SECRET; // Ensure this is set in your .env file

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).send({ error: 'You must be logged in' });
    }

    const token = authorization.replace('Bearer ', '');

    jwt.verify(token, jwtKey, async (err, payload) => {
        if (err) {
            return res.status(401).send({ error: 'You must be logged in' });
        }

        const { userId } = payload;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).send({ error: 'User not found' });
        }

        req.user = user;
        next();
    });
};
