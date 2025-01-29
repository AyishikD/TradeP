const express = require('express');
const userRoutes = require('./userRoutes'); // Import user-related routes
const orderRoutes = require('./orderRoutes'); // Import order-related routes

const router = express.Router();

// Use user-related routes
router.use('/users', userRoutes);

// Use order-related routes
router.use('/orders', orderRoutes);

module.exports = router;
