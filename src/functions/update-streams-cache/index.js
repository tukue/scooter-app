const AWS = require('aws-sdk');
const redis = require('redis');
const { promisify } = require('util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const redisClient = redis.createClient({
  host: process.env.REDIS_ENDPOINT,
  port: 6379,
});

const zaddAsync = promisify(redisClient.zadd).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      if (record.eventName === 'MODIFY' || record.eventName === 'INSERT') {
        const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

        if (record.eventSource === 'aws:dynamodb' && record.eventSourceARN.includes('table/Fleet')) {
          await updateFleetCache(newImage);
        } else if (record.eventSource === 'aws:dynamodb' && record.eventSourceARN.includes('table/Trip')) {
          await updateTripCache(newImage);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Cache updated successfully' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error updating cache' }) };
  }
};

async function updateFleetCache(fleetItem) {
  // Update fleet information in Redis
  await hsetAsync(`fleet:${fleetItem.id}`, 'status', fleetItem.status, 'location', JSON.stringify(fleetItem.location));

  // Update fleet availability leaderboard
  if (fleetItem.status === 'available') {
    await zaddAsync('available_fleets', Date.now(), fleetItem.id);
  } else {
    await redisClient.zrem('available_fleets', fleetItem.id);
  }
}

async function updateTripCache(tripItem) {
  // Update trip information in Redis
  await hsetAsync(`trip:${tripItem.id}`, 
    'userId', tripItem.userId,
    'fleetId', tripItem.fleetId,
    'status', tripItem.status,
    'startTime', tripItem.startTime,
    'endTime', tripItem.endTime || '',
    'distance', tripItem.distance || '0'
  );

  // Update user leaderboard if trip is completed
  if (tripItem.status === 'completed') {
    const userScore = await dynamodb.get({
      TableName: process.env.USER_TABLE,
      Key: { id: tripItem.userId },
      ProjectionExpression: 'totalDistance'
    }).promise();

    if (userScore.Item) {
      await zaddAsync('user_leaderboard', userScore.Item.totalDistance, tripItem.userId);
    }
  }
}
