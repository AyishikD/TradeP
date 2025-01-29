const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { logger } = require('./utils/error') 
const  sequelize  = require('./config/database');
const marketDataService = require('./services/marketData');  // Corrected import for MarketDataService
const matchingEngine = require('./services/matchingEngine'); // Importing the MatchingEngine instance
const { initOrderBook } = require('./config/redis'); // Import the Redis order book initialization function
const indexRoutes = require('./routes'); // Import the index.js where all routes are aggregated
require('dotenv').config();

const app = express();
app.use(cors());
const port=3000;
// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (Sequelize setup)
require('./config/database');

// Initialize the order book (in Redis)
initOrderBook(); // Setup the order book in Redis

// Start fetching market data periodically (every 30 seconds, for example)
marketDataService.startMarketDataFeed('AAPL', 30000);  // Start market data feed for AAPL every 30 seconds

// Example route to test matching engine order matching
app.post('/api/orders', async (req, res) => {
  const orderData = req.body; // Assumed structure: { type, symbol, price, quantity, userId }
  
  try {
    const order = await matchingEngine.addOrder(orderData);  // Add new order to order book
    res.status(201).json({ message: 'Order added successfully', order });
    
    // Attempt to match incoming order
    await matchingEngine.matchOrder(orderData);  // Match the order immediately after adding
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Use the index.js route aggregator
app.use('/api', indexRoutes); // All routes will be prefixed with /api

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

sequelize.sync({alter:true})
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
    logger.error('Error syncing database:', error.message);
  });

module.exports = app;  // Export the app for use in server.js
