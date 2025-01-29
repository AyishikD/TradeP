require('dotenv').config();

module.exports = {
  // Order Status
  ORDER_STATUS: {
    PENDING: 'PENDING',
    PARTIALLY_FILLED: 'PARTIALLY_FILLED',
    FILLED: 'FILLED',
    CANCELED: 'CANCELED',
    REJECTED: 'REJECTED',
  },

  // Order Types
  ORDER_TYPE: {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    STOP_LOSS: 'STOP_LOSS',
  },

  // Order Sides
  ORDER_SIDE: {
    BUY: 'BUY',
    SELL: 'SELL',
  },

  // Matching Engine Modes
  MATCHING_MODE: {
    FIFO: 'FIFO', // First-In, First-Out
    PRO_RATA: 'PRO_RATA', // Orders are matched proportionally
  },

  // Market Data Constants
  MARKET_DATA: {
    API_URL: process.env.MARKET_DATA_API_URL || 'https://www.alphavantage.co/query',
    MQTT_TOPIC: process.env.MARKET_DATA_MQTT_TOPIC || 'market/data',
  },

  // Risk Management Settings
  RISK_MANAGEMENT: {
    MAX_POSITION_LIMIT: parseFloat(process.env.MAX_POSITION_LIMIT) || 10000,
    MAX_LOSS_THRESHOLD: parseFloat(process.env.MAX_LOSS_THRESHOLD) || 5000,
    MARGIN_REQUIREMENT: parseFloat(process.env.MARGIN_REQUIREMENT) || 0.2, // 20% margin requirement
  },

  // Redis Keys
  REDIS_KEYS: {
    ORDER_BOOK: 'orderBook',
    MARKET_PRICE: 'marketPrice',
    USER_BALANCE: (userId) => `userBalance:${userId}`,
    USER_POSITION: (userId, symbol) => `position:${userId}:${symbol}`,
    USER_DAILY_LOSS: (userId) => `loss:${userId}`,
  },

  // JWT Settings
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
    EXPIRATION: '7d',
  },

  // Exchange Trading Hours (24-hour format)
  TRADING_HOURS: {
    OPEN: 9, // 9 AM
    CLOSE: 16, // 4 PM
  },

  // API Rate Limits (for external APIs)
  API_RATE_LIMIT: {
    MAX_REQUESTS: 5, // Max 5 requests per second
    TIME_WINDOW: 1000, // 1000 ms = 1 second
  },

  // Default Trading Fee (in %)
  TRADING_FEES: {
    MAKER_FEE: 0.1, // 0.1% for maker orders
    TAKER_FEE: 0.2, // 0.2% for taker orders
  },
};
