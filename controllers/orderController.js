const redis = require('../config/redis'); // Redis connection
const { Order } = require('../models/Order'); // Sequelize models
const { Op } = require('sequelize'); // Sequelize operators
const { BUY_ORDER_BOOK, SELL_ORDER_BOOK } = require('../utils/constants'); // Redis keys for order books
const matchController = require('./matchController'); // Match controller for matching logic
const riskManagement = require('../services/riskManagement'); // Risk management service

/**
 * Create a new order.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function createOrder(req, res) {
  const { price, quantity, type, userId } = req.body;

  // Basic validation
  if (!price || !quantity || !type || !userId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Perform risk checks before proceeding
    const riskCheck = await riskManagement.validateOrder({ price, quantity, type, userId });
    if (!riskCheck.success) {
      return res.status(400).json({ error: riskCheck.message });
    }

    // Save order to the database
    const newOrder = await Order.create({ price, quantity, type, userId });

    // Add order to the Redis order book
    const orderData = { id: newOrder.id, price, quantity, userId, timestamp: Date.now() };
    if (type === 'buy') {
      await redis.zadd(BUY_ORDER_BOOK, price, JSON.stringify(orderData));
    } else if (type === 'sell') {
      await redis.zadd(SELL_ORDER_BOOK, price, JSON.stringify(orderData));
    } else {
      return res.status(400).json({ error: 'Invalid order type.' });
    }

    // Trigger order matching
    await matchController.matchOrders(type);

    res.status(201).json({ message: 'Order created successfully.', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get all orders for a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function getUserOrders(req, res) {
  const { userId } = req.params;

  try {
    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Cancel an order by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function cancelOrder(req, res) {
  const { orderId } = req.params;

  try {
    // Find the order in the database
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Delete the order from the database
    await order.destroy();

    // Remove the order from the Redis order book
    const orderBookKey = order.type === 'buy' ? BUY_ORDER_BOOK : SELL_ORDER_BOOK;
    const orderData = JSON.stringify({
      id: order.id,
      price: order.price,
      quantity: order.quantity,
      userId: order.userId,
    });
    await redis.zrem(orderBookKey, orderData);

    res.status(200).json({ message: 'Order canceled successfully.' });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get the order book (buy and sell orders).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function getOrderBook(req, res) {
  try {
    const buyOrders = await redis.zrange(BUY_ORDER_BOOK, 0, -1, 'WITHSCORES');
    const sellOrders = await redis.zrange(SELL_ORDER_BOOK, 0, -1, 'WITHSCORES');

    res.status(200).json({
      buyOrders: formatOrders(buyOrders),
      sellOrders: formatOrders(sellOrders),
    });
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Format Redis order data into structured objects.
 * @param {Array} orderData - Array of order data from Redis.
 * @returns {Array} Formatted order objects.
 */
function formatOrders(orderData) {
  const formattedOrders = [];
  for (let i = 0; i < orderData.length; i += 2) {
    const order = JSON.parse(orderData[i]);
    const price = parseFloat(orderData[i + 1]);
    formattedOrders.push({ ...order, price });
  }
  return formattedOrders;
}

module.exports = {
    createOrder,        // Exporting the correct method name
    getUserOrders,
    cancelOrder,
    getOrderBook,
  };