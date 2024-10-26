const redis = require('redis');
const { promisify } = require('util');

let redisClient;

exports.handler = async (event) => {
  if (!redisClient) {
    redisClient = redis.createClient({
      host: process.env.REDIS_ENDPOINT,
      port: 6379
    });
  }

  const getAsync = promisify(redisClient.get).bind(redisClient);

  try {
    const { latitude, longitude, radius } = JSON.parse(event.body);

    if (!latitude || !longitude || !radius) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters' })
      };
    }

    // Create a key for Redis based on the search parameters
    const searchKey = `scooters:${latitude}:${longitude}:${radius}`;

    // Attempt to retrieve the data from Redis
    const cachedResult = await getAsync(searchKey);

    if (cachedResult) {
      return {
        statusCode: 200,
        body: cachedResult
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No scooters found for the given parameters' })
      };
    }
  } catch (error) {
    console.error('Error searching scooters:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error searching scooters' })
    };
  }
};
