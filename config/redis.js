const Redis = require('ioredis');
require('dotenv').config();

// Redis client configuration
const redisHost = process.env.REDIS_HOST || 'balanced-lionfish-44321.upstash.io'; // Your Redis host
const redisPassword = process.env.REDIS_PASSWORD || ''; // Your Redis password

// If "REDIS_TLS" is truthy, enable TLS for secure connection
const redisTls = process.env.REDIS_TLS
  ? { servername: redisHost }
  : undefined;

// Redis options
const redisOptions = {
  host: redisHost,
  password: redisPassword,
  tls: redisTls, // Apply TLS if required
};

const redisClient = new Redis(redisOptions);

// Event listeners for Redis client
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully.');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Optional: Ping Redis to verify the connection (useful during initialization)
async function checkRedisConnection() {
  try {
    const pong = await redisClient.ping();
    console.log(`✅ Redis ping response: ${pong}`); // Should log "PONG"
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error.message);
  }
}

// Call the connection check on startup
checkRedisConnection();

// Function to initialize the order book in Redis (for trading engine)
const initOrderBook = async () => {
  try {
    const orderBookKey = 'orderBook';
    const orderBookExists = await redisClient.exists(orderBookKey);

    if (!orderBookExists) {
      // If the order book doesn't exist, initialize it with an empty array
      await redisClient.set(orderBookKey, JSON.stringify([]), 'EX', 3600); // Set a TTL of 1 hour
      console.log('📚 Initialized the order book in Redis.');
    } else {
      console.log('📚 Order book already exists in Redis.');
    }
  } catch (error) {
    console.error('❌ Error initializing the order book in Redis:', error.message);
  }
};

// Initialize the order book
initOrderBook();

// Export the Redis client and the initialization function
module.exports = { redisClient, initOrderBook };
