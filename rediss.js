const {redisClient} = require('./config/redis'); // Ensure correct import

async function testRedis() {
  try {
    await redisClient.zAdd('testZSet', [{ score: 1, value: 'testValue' }]);
    console.log('✅ zAdd success!');
  } catch (error) {
    console.error('❌ zAdd failed:', error);
  }
}

testRedis();
