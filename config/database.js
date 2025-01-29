const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for some cloud-hosted databases
    },
  },
});

// Function to test the database connection with retries
async function connectWithRetry() {
  let retries = 10; // Retry limit
  let retryDelay = 1000; // Initial delay in milliseconds

  while (retries > 0) {
    try {
      await sequelize.authenticate(); // Attempt to authenticate with the database
      console.log('Database connected successfully.');
      break; // Exit loop if connection is successful
    } catch (error) {
      console.error(`Connection attempt failed: ${error.message}. Retries remaining: ${retries - 1}`);
      retries -= 1; // Decrement retry counter
      if (retries > 0) {
        console.log(`Waiting for ${retryDelay}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Wait before retrying
        retryDelay *= 2; // Double the delay for the next retry
      } else {
        console.error('Unable to connect to the database after multiple attempts.');
      }
    }
  }
}

connectWithRetry(); // Call the retry function to start the connection process

module.exports = sequelize;