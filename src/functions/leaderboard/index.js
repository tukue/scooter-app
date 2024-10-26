const redis = require('redis');
const { promisify } = require('util');

let redisClient;

const connectToRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = redis.createClient({
    host: process.env.REDIS_ENDPOINT,
    port: 6379,
  });

  return redisClient;
};

exports.handler = async (event) => {
  const { httpMethod, path } = event;
  const body = JSON.parse(event.body || '{}');

  try {
    const redisClient = connectToRedis();
    const zaddAsync = promisify(redisClient.zadd).bind(redisClient);
    const zrevrangeAsync = promisify(redisClient.zrevrange).bind(redisClient);
    const zrevrankAsync = promisify(redisClient.zrevrank).bind(redisClient);
    const zscoreAsync = promisify(redisClient.zscore).bind(redisClient);

    switch (`${httpMethod} ${path}`) {
      case 'POST /leaderboard/update':
        const { userId, score } = body;
        if (!userId || score === undefined) {
          return { statusCode: 400, body: JSON.stringify({ message: 'Missing userId or score' }) };
        }
        await zaddAsync('leaderboard', score, userId);
        return { statusCode: 200, body: JSON.stringify({ message: 'Leaderboard updated' }) };

      case 'GET /leaderboard/top-riders':
        const { count = 10 } = event.queryStringParameters || {};
        const topRiders = await zrevrangeAsync('leaderboard', 0, count - 1, 'WITHSCORES');
        const formattedTopRiders = [];
        for (let i = 0; i < topRiders.length; i += 2) {
          formattedTopRiders.push({ userId: topRiders[i], score: parseFloat(topRiders[i + 1]) });
        }
        return { statusCode: 200, body: JSON.stringify(formattedTopRiders) };

      case 'GET /leaderboard/rank':
        const { userId: rankUserId } = event.queryStringParameters || {};
        if (!rankUserId) {
          return { statusCode: 400, body: JSON.stringify({ message: 'Missing userId' }) };
        }
        const rank = await zrevrankAsync('leaderboard', rankUserId);
        const score = await zscoreAsync('leaderboard', rankUserId);
        if (rank === null) {
          return { statusCode: 404, body: JSON.stringify({ message: 'User not found in leaderboard' }) };
        }
        return { statusCode: 200, body: JSON.stringify({ userId: rankUserId, rank: rank + 1, score: parseFloat(score) }) };

      default:
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
