const redis = require('../config/redis');
const { Order } = require('../models/Order');
const { Trade } = require('../models/Trade');
const { User } = require('../models/User');
require('dotenv').config();

class RiskManagement {
  constructor() {
    this.maxPositionLimit = parseFloat(process.env.MAX_POSITION_LIMIT) || 10000; // Max position per user
    this.maxLossThreshold = parseFloat(process.env.MAX_LOSS_THRESHOLD) || 5000; // Max loss per day
    this.marginRequirement = parseFloat(process.env.MARGIN_REQUIREMENT) || 0.2; // 20% margin requirement
  }

  /**
   * Checks if the user has exceeded their position limits
   * @param {number} userId - User's ID
   * @param {string} symbol - Stock symbol
   * @param {number} quantity - Order quantity
   * @returns {boolean} - Whether the position exceeds the limit
   */
  async checkPositionLimit(userId, symbol, quantity) {
    const currentPosition = await redis.get(`position:${userId}:${symbol}`) || 0;
    const newPosition = parseFloat(currentPosition) + quantity;

    if (newPosition > this.maxPositionLimit) {
      console.log(`❌ Position limit exceeded for User ${userId} on ${symbol}`);
      return false;
    }
    
    return true;
  }

  /**
   * Checks if the user has exceeded daily loss limits
   * @param {number} userId - User's ID
   * @returns {boolean} - Whether the loss exceeds the limit
   */
  async checkDailyLossLimit(userId) {
    const userLoss = await redis.get(`loss:${userId}`) || 0;

    if (parseFloat(userLoss) > this.maxLossThreshold) {
      console.log(`❌ Daily loss limit exceeded for User ${userId}`);
      return false;
    }

    return true;
  }

  /**
   * Calculates margin requirement for the order
   * @param {number} userId - User's ID
   * @param {number} orderValue - Total order value
   * @returns {boolean} - Whether the user has sufficient margin
   */
  async checkMargin(userId, orderValue) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return false;
    }

    const requiredMargin = orderValue * this.marginRequirement;
    
    if (user.balance < requiredMargin) {
      console.log(`❌ Insufficient margin for User ${userId}. Required: ${requiredMargin}, Available: ${user.balance}`);
      return false;
    }

    return true;
  }

  /**
   * Updates user positions and loss after a trade
   * @param {object} trade - Trade object
   */
  async updateRiskMetrics(trade) {
    const { buyerId, sellerId, symbol, price, quantity } = trade;
    const tradeValue = price * quantity;

    // Update positions in Redis
    await redis.incrbyfloat(`position:${buyerId}:${symbol}`, quantity);
    await redis.incrbyfloat(`position:${sellerId}:${symbol}`, -quantity);

    // Update daily loss (if any)
    await redis.incrbyfloat(`loss:${buyerId}`, -tradeValue);
    await redis.incrbyfloat(`loss:${sellerId}`, tradeValue);

    console.log(`✅ Risk metrics updated for trade ${trade.id}`);
  }

  /**
   * Validates an order before execution
   * @param {object} order - Order object
   * @returns {boolean} - Whether the order is valid
   */
  async validateOrder(order) {
    const { userId, symbol, price, quantity } = order;
    const orderValue = price * quantity;

    const positionValid = await this.checkPositionLimit(userId, symbol, quantity);
    const lossValid = await this.checkDailyLossLimit(userId);
    const marginValid = await this.checkMargin(userId, orderValue);

    return positionValid && lossValid && marginValid;
  }
}

module.exports = new RiskManagement();
