const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  User  = require('../models/User'); // Sequelize User model
require('dotenv').config();

/**
 * Register a new user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function registerUser(req, res) {
  const { name, email, password, balance } = req.body;

  try {
    console.log(req.body); // Log the incoming request body

    const { email } = req.body;
    console.log('Registering user with email:', email); // Log email to check
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }

    // Validate password format (must contain both letters and numbers)

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      balance: balance || 0, // Default balance is 0 if not provided
    });

    res.status(201).json({ message: 'User registered successfully.', userId: newUser.id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Log in an existing user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d', // Token valid for 1 day
    });

    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get user profile details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function getUserProfile(req, res) {
  const userId = req.user.id; // Assuming `req.user` is populated by an authentication middleware

  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }, // Exclude the password field
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update user balance.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function updateBalance(req, res) {
  const userId = req.user.id; // Assuming `req.user` is populated by an authentication middleware
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update balance
    user.balance += amount;
    await user.save();

    res.status(200).json({ message: 'Balance updated successfully.', balance: user.balance });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a user account.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function deleteUser(req, res) {
  const userId = req.user.id; // Assuming `req.user` is populated by an authentication middleware

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete the user
    await user.destroy();

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateBalance,
  deleteUser,
};