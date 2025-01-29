const crypto = require('crypto');
const { TRADING_HOURS } = require('./constants');

/**
 * Generate a unique order ID
 * @returns {string} A unique order ID
 */
function generateOrderId() {
  return `ORD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

/**
 * Get the current timestamp in ISO format
 * @returns {string} ISO-formatted timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Check if the trading market is open
 * @returns {boolean} True if market is open, otherwise false
 */
function isMarketOpen() {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= TRADING_HOURS.OPEN && currentHour < TRADING_HOURS.CLOSE;
}

/**
 * Sleep function for delaying execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Round a number to a specific number of decimal places
 * @param {number} value - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
function roundToDecimals(value, decimals = 2) {
  return parseFloat(value.toFixed(decimals));
}

/**
 * Validate if a number is positive
 * @param {number} value - Number to check
 * @returns {boolean} True if positive, otherwise false
 */
function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Convert price string to a valid float
 * @param {string} price - Price value as a string
 * @returns {number} Parsed float value
 */
function parsePrice(price) {
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate trading fees based on order type
 * @param {number} amount - Order amount
 * @param {string} orderType - Order type (MAKER/TAKER)
 * @param {object} fees - Trading fee configuration
 * @returns {number} Calculated fee
 */
function calculateTradingFee(amount, orderType, fees) {
  const feeRate = orderType === 'MAKER' ? fees.MAKER_FEE : fees.TAKER_FEE;
  return roundToDecimals((amount * feeRate) / 100, 6);
}

/**
 * Hash a value using SHA256
 * @param {string} value - Value to hash
 * @returns {string} Hashed value
 */
function hashSHA256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Log a structured message
 * @param {string} level - Log level (info, warning, error)
 * @param {string} message - Log message
 * @param {object} [data] - Additional data (optional)
 */
function logMessage(level, message, data = {}) {
  console.log(JSON.stringify({ level, message, timestamp: getCurrentTimestamp(), ...data }));
}

module.exports = {
  generateOrderId,
  getCurrentTimestamp,
  isMarketOpen,
  sleep,
  roundToDecimals,
  isPositiveNumber,
  parsePrice,
  calculateTradingFee,
  hashSHA256,
  logMessage,
};
