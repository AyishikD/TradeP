const redis = require('../config/redis'); // Redis connection
const { Order } = require('../models/Order');
const { Trade } = require('../models/Trade');
const riskManagement = require('../services/riskManagement'); // Risk management service
const { Op } = require('sequelize'); // Sequelize operators

// Constants for Redis keys
const BUY_ORDER_BOOK = 'orderBook:buy';
const SELL_ORDER_BOOK = 'orderBook:sell';

/**
 * Add a new order to the order book.
 * @param {Object} order - The order object (price, quantity, type, userId).
 */
async function addOrder(req, res) {
  const { price, quantity, type, userId } = req.body;

  // Basic validation
  if (!price || !quantity || !type || !userId) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Perform risk checks before proceeding
    const riskCheck = await riskManagement.validateOrder(req.body);
    if (!riskCheck.success) {
      return res.status(400).json({ error: riskCheck.message });
    }

    // Store the order in Redis
    const orderData = { price, quantity, userId, timestamp: Date.now() };

    if (type === 'buy') {
      await redis.zadd(BUY_ORDER_BOOK, price, JSON.stringify(orderData));
    } else if (type === 'sell') {
      await redis.zadd(SELL_ORDER_BOOK, price, JSON.stringify(orderData));
    } else {
      return res.status(400).json({ error: 'Invalid order type.' });
    }

    // Return success response
    res.status(201).json({ message: 'Order added to the order book.', order: orderData });

    // Attempt to match the order
    await matchOrders(type);
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Match orders in the order book.
 * @param {string} orderType - The type of the incoming order (buy/sell).
 */
async function matchOrders(orderType) {
    const bookToMatch = orderType === 'buy' ? SELL_ORDER_BOOK : BUY_ORDER_BOOK;
    const currentBook = orderType === 'buy' ? BUY_ORDER_BOOK : SELL_ORDER_BOOK;
  
    try {
      // Fetch orders from Redis
      const [incomingOrderData] = await redis.zrange(currentBook, 0, 0, 'WITHSCORES');
      if (!incomingOrderData) return; // No incoming orders
  
      const incomingOrder = JSON.parse(incomingOrderData);
      const matchingOrders = await redis.zrange(bookToMatch, 0, -1, 'WITHSCORES');
  
      if (!matchingOrders.length) return; // No matching orders in the opposite book
  
      // Prepare pipeline for efficient Redis operations
      const pipeline = redis.pipeline();
      let tradesExecuted = false;
  
      for (let i = 0; i < matchingOrders.length; i += 2) {
        const matchedOrderData = JSON.parse(matchingOrders[i]);
        const matchedPrice = parseFloat(matchingOrders[i + 1]);
  
        // Match only if the prices satisfy the condition
        const isMatch =
          (orderType === 'buy' && incomingOrder.price >= matchedPrice) ||
          (orderType === 'sell' && incomingOrder.price <= matchedPrice);
  
        if (isMatch) {
          // Calculate trade details
          const tradeQuantity = Math.min(incomingOrder.quantity, matchedOrderData.quantity);
          const tradePrice = matchedPrice;
  
          // Create a trade record in the database
          const trade = await Trade.create({
            buyerId: orderType === 'buy' ? incomingOrder.userId : matchedOrderData.userId,
            sellerId: orderType === 'buy' ? matchedOrderData.userId : incomingOrder.userId,
            price: tradePrice,
            quantity: tradeQuantity,
          });
  
          console.log('Trade executed:', trade.toJSON());
  
          // Update order quantities
          incomingOrder.quantity -= tradeQuantity;
          matchedOrderData.quantity -= tradeQuantity;
  
          // Queue Redis commands for removing or updating orders
          if (matchedOrderData.quantity === 0) {
            pipeline.zrem(bookToMatch, JSON.stringify(matchedOrderData));
          } else {
            pipeline.zadd(bookToMatch, matchedPrice, JSON.stringify(matchedOrderData));
          }
  
          if (incomingOrder.quantity === 0) {
            pipeline.zrem(currentBook, JSON.stringify(incomingOrder));
            tradesExecuted = true; // No more quantity to match for the incoming order
            break; // Exit loop if incoming order is fully matched
          }
        }
    }
  
      if (tradesExecuted) {
        // Execute Redis pipeline commands in a single batch for efficiency
        await pipeline.exec();
      }
    } catch (error) {
      console.error('Error matching orders:', error);
    }
  }

/**
 * Get the current order book.
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
 * Format orders from Redis into a structured array.
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
  addOrder,
  matchOrders,
  getOrderBook,
};
