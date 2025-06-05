const redis = require('redis');
const { promisify } = require('util');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

let redisClient;

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

exports.handler = async (event) => {
  if (!redisClient) {
    redisClient = redis.createClient({
      host: process.env.REDIS_ENDPOINT,
      port: 6379
    });
  }

  const getAsync = promisify(redisClient.get).bind(redisClient);
  const setAsync = promisify(redisClient.set).bind(redisClient);
  const expireAsync = promisify(redisClient.expire).bind(redisClient);

  try {
    const { latitude, longitude, radius } = JSON.parse(event.body);

    if (!latitude || !longitude || !radius) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters' })
      };
    }

    // Create a key for Redis based on the search parameters
    // Round coordinates to 3 decimal places to improve cache hits
    const roundedLat = Math.round(latitude * 1000) / 1000;
    const roundedLon = Math.round(longitude * 1000) / 1000;
    const searchKey = `scooters:${roundedLat}:${roundedLon}:${radius}`;

    // Attempt to retrieve the data from Redis
    const cachedResult = await getAsync(searchKey);

    if (cachedResult) {
      return {
        statusCode: 200,
        body: cachedResult
      };
    }

    // If not in cache, search in DynamoDB
    const params = {
      TableName: process.env.FLEET_TABLE,
      FilterExpression: '#status = :available',
      ExpressionAttributeNames: {
        '#status': 'Status'
      },
      ExpressionAttributeValues: {
        ':available': 'AVAILABLE'
      }
    };

    const { Items: scooters } = await dynamodb.scan(params).promise();

    // Filter scooters by distance
    const nearbyScooters = scooters
      .map(scooter => ({
        ...scooter,
        distance: calculateDistance(
          latitude,
          longitude,
          scooter.Location.Latitude,
          scooter.Location.Longitude
        )
      }))
      .filter(scooter => scooter.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Cache the results for 5 minutes
    const result = JSON.stringify(nearbyScooters);
    await setAsync(searchKey, result);
    await expireAsync(searchKey, 300); // 5 minutes TTL

    return {
      statusCode: 200,
      body: result
    };
  } catch (error) {
    console.error('Error searching scooters:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error searching scooters' })
    };
  }
};