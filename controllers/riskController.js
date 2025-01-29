const { User, sequelize } = require('../models/User');
const { Order } = require('../models/Order'); // Sequelize models
const redis = require('../config/redis'); // Redis connection
const { BUY_ORDER_BOOK, SELL_ORDER_BOOK } = require('../utils/constants'); // Redis keys for order books

/**
 * Validates an order for compliance with risk policies.
 * @param {Object} order - The order to be validated.
 * @returns {Object} Validation result.
 */
async function validateOrder(order) {
  const { price, quantity, type, userId } = order;

  // Ensure basic fields are present
  if (!price || !quantity || !type || !userId) {
    return { valid: false, error: 'Missing required fields.' };
  }

  // Validate order type
  if (!['buy', 'sell'].includes(type)) {
    return { valid: false, error: 'Invalid order type.' };
  }

  // Ensure price and quantity are positive
  if (price <= 0 || quantity <= 0) {
    return { valid: false, error: 'Price and quantity must be positive numbers.' };
  }

  // Check user account balance or holdings for sufficient funds/stock
  const user = await User.findByPk(userId);
  if (!user) {
    return { valid: false, error: 'User not found.' };
  }

  // Redis caching: Check if balance is cached
  const cachedBalance = await redis.get(`user:${userId}:balance`);
  const balance = cachedBalance ? parseFloat(cachedBalance) : user.balance;

  if (type === 'buy') {
    const requiredBalance = price * quantity;
    if (balance < requiredBalance) {
      return { valid: false, error: 'Insufficient account balance to place the order.' };
    }
  } else if (type === 'sell') {
    const userHoldings = await getUserHoldings(userId);
    if (userHoldings < quantity) {
      return { valid: false, error: 'Insufficient stock holdings to place the sell order.' };
    }
  }

  // Additional checks can go here (e.g., market conditions, volatility thresholds)
  return { valid: true };
}

/**
 * Checks if a user's order violates daily risk limits.
 * @param {number} userId - User ID.
 * @param {Object} order - Order details.
 * @returns {Object} Risk check result.
 */
async function checkDailyRiskLimit(userId, order) {
  const MAX_DAILY_ORDER_VALUE = 100000; // Example risk limit (in currency units)

  // Redis caching: Check if daily order total is cached
  const cachedDailyOrderValue = await redis.get(`user:${userId}:dailyOrderValue`);
  let totalOrderValueToday = cachedDailyOrderValue ? parseFloat(cachedDailyOrderValue) : 0;

  if (!cachedDailyOrderValue) {
    const userOrders = await Order.findAll({
      where: {
        userId,
        createdAt: {
          [Op.gte]: new Date().setHours(0, 0, 0, 0), // Today's date
        },
      },
    });

    totalOrderValueToday = userOrders.reduce(
      (sum, order) => sum + order.price * order.quantity,
      0
    );
    // Cache the total daily order value
    await redis.set(`user:${userId}:dailyOrderValue`, totalOrderValueToday);
  }

  const newOrderValue = order.price * order.quantity;

  if (totalOrderValueToday + newOrderValue > MAX_DAILY_ORDER_VALUE) {
    return {
      valid: false,
      error: `Daily order value limit exceeded. Max allowed: ${MAX_DAILY_ORDER_VALUE}.`,
    };
  }

  return { valid: true };
}

/**
 * Get a user's stock holdings for validation.
 * @param {number} userId - User ID.
 * @returns {number} Total stock holdings of the user.
 */
async function getUserHoldings(userId) {
  // Redis caching: Check if holdings are cached
  const holdings = await redis.get(`user:${userId}:holdings`);
  return holdings ? parseInt(holdings, 10) : 0;
}

/**
 * Risk management middleware for validating incoming orders.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
async function riskMiddleware(req, res, next) {
  const { price, quantity, type, userId } = req.body;

  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    // Validate order structure
    const validation = await validateOrder({ price, quantity, type, userId });
    if (!validation.valid) {
      await transaction.rollback(); // Rollback if validation fails
      return res.status(400).json({ error: validation.error });
    }

    // Check daily risk limits
    const dailyLimitCheck = await checkDailyRiskLimit(userId, { price, quantity });
    if (!dailyLimitCheck.valid) {
      await transaction.rollback(); // Rollback if daily limit check fails
      return res.status(400).json({ error: dailyLimitCheck.error });
    }

    // Pass risk checks
    await transaction.commit(); // Commit transaction if all checks pass
    next();
  } catch (error) {
    console.error('Error in risk middleware:', error);
    await transaction.rollback(); // Rollback in case of error
    res.status(500).json({ error: 'Internal server error during risk validation.' });
  }
}

module.exports = {
  validateOrder,
  checkDailyRiskLimit,
  riskMiddleware,
};
