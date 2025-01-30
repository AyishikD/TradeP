const express = require('express');
const authenticate = require('../middleware/auth'); // Authentication middleware
const userController = require('../controllers/userController'); // Controller for user-related logic

const router = express.Router();

// Register a new user
router.post('/register', userController.registerUser); // Call registerUser here

// Login user
router.post('/login', userController.loginUser); // Call loginUser here

// Get logged-in user details
router.get('/me', authenticate, userController.getUserProfile); // Call getUserProfile here

// Update user profile (name, email, etc.)
router.put('/update-profile', authenticate, userController.updateBalance); // Call updateBalance here

// Change user password
router.delete('/delete', authenticate, userController.deleteUser); // If you have a changePassword function
module.exports = router;
