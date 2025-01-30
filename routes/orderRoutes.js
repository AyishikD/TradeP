const express = require('express');
const authenticate = require('../middleware/auth'); // Authentication middleware
const orderController = require('../controllers/orderController'); // Controller for order-related logic

const router = express.Router();

// Place a new order
router.post('/', authenticate, orderController.createOrder); // Change this to createOrder

// Get order details by ID
router.get('/:id', authenticate, orderController.getOrderBook);

// Get all orders for the authenticated user
router.get('/all', authenticate, orderController.getUserOrders);

// Cancel an existing order
router.delete('/:id', authenticate, orderController.cancelOrder);

module.exports = router;
