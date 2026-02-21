const https = require('https');
const { createClient } = require('redis');

const apiUrl = 'https://chat-app-42rc.onrender.com/api/get_stock_price/?stock=HINDCOPPER&exchange=NSE';

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 12547
  }
});

redisClient.on('error', err => console.error('Redis Client Error', err));

async function fetchApiResponse() {
  return new Promise((resolve, reject) => {
    https.get(apiUrl, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => resolve({ statusCode: response.statusCode, body: data }));
    }).on('error', (err) => reject(err));
  });
}

module.exports = async (req, res) => {
  try {
    await redisClient.connect();

    const apiResponse = await fetchApiResponse();

    // Try to parse JSON; if it fails, keep raw body
    let toStore;
    try {
      const parsed = JSON.parse(apiResponse.body);
      toStore = JSON.stringify(parsed);
    } catch (e) {
      toStore = apiResponse.body;
    }

    const ttl = process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL, 10) : null;
    if (ttl && !Number.isNaN(ttl) && ttl > 0) {
      await redisClient.set('stk_res', toStore, { EX: ttl });
    } else {
      await redisClient.set('stk_res', toStore);
    }

    res.status(apiResponse.statusCode || 200).send(apiResponse.body);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Failed to fetch/store API response' });
  } finally {
    try {
      if (redisClient.isOpen) await redisClient.quit();
    } catch (e) {
      console.error('Error closing Redis:', e);
    }
  }
};
