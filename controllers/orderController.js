const { redisClient } = require('../config/redis');
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
  const { price, quantity, type } = req.body;

  if (!price || !quantity || !type) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const riskCheck = await riskManagement.validateOrder({ price, quantity, type });
    if (!riskCheck.success) {
      return res.status(400).json({ error: riskCheck.message });
    }

    const newOrder = await Order.create({ price, quantity, type });

    const orderData = { id: newOrder.id, price, quantity, timestamp: Date.now() };
    const orderKey = type === 'buy' ? BUY_ORDER_BOOK : SELL_ORDER_BOOK;

    await redisClient.zAdd(orderKey, [{ score: price, value: JSON.stringify(orderData) }]);

    await matchController.matchOrders(type);

    res.status(201).json({ message: 'Order created successfully.', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get all orders for a user.
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
 */
async function cancelOrder(req, res) {
  const { orderId } = req.params;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await order.destroy();

    const orderKey = order.type === 'buy' ? BUY_ORDER_BOOK : SELL_ORDER_BOOK;
    const orders = await redisClient.zRange(orderKey, 0, -1, { WITHSCORES: true });

    // Find the correct order in Redis
    let orderToRemove = null;
    for (let i = 0; i < orders.length; i += 2) {
      const parsedOrder = JSON.parse(orders[i]);
      if (parsedOrder.id === order.id) {
        orderToRemove = orders[i];
        break;
      }
    }

    if (orderToRemove) {
      await redisClient.zRem(orderKey, orderToRemove);
    }

    res.status(200).json({ message: 'Order canceled successfully.' });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get the order book.
 */
async function getOrderBook(req, res) {
  try {
    const buyOrders = await redisClient.zRange(BUY_ORDER_BOOK, 0, -1, { WITHSCORES: true });
    const sellOrders = await redisClient.zRange(SELL_ORDER_BOOK, 0, -1, { WITHSCORES: true });

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
  createOrder,
  getUserOrders,
  cancelOrder,
  getOrderBook,
};
