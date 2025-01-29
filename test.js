const Redis = require('ioredis');
require('dotenv').config();

// Redis client configuration
const redisHost = process.env.REDIS_HOST || 'redis';
const redisPassword = process.env.REDIS_PASSWORD || '';

// If "REDIS_TLS" is truthy, enable TLS for secure connection
const redisTls = process.env.REDIS_TLS
  ? { servername: redisHost }
  : undefined;

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

async function checkRedisConnection() {
  try {
    const pong = await redisClient.ping();
    console.log(`✅ Redis ping response: ${pong}`); // Should log "PONG"
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error.message);
  }
}

checkRedisConnection();
