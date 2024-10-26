const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { operation } = event.queryStringParameters || {};
  const body = JSON.parse(event.body);

  switch (operation) {
    case 'start':
      return startTrip(body);
    case 'end':
      return endTrip(body);
    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid operation' })
      };
  }
};

async function startTrip(body) {
  const { userId, scooterId } = body;

  if (!userId || !scooterId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters' })
    };
  }

  try {
    // Check if the scooter is available and update its status
    const scooterParams = {
      TableName: process.env.FLEET_TABLE,
      Key: { ScooterId: scooterId },
      ConditionExpression: 'attribute_exists(ScooterId) AND #status = :available',
      UpdateExpression: 'SET #status = :inUse',
      ExpressionAttributeNames: {
        '#status': 'Status'
      },
      ExpressionAttributeValues: {
        ':available': 'AVAILABLE',
        ':inUse': 'IN_USE'
      },
      ReturnValues: 'ALL_NEW'
    };

    const scooterData = await dynamodb.update(scooterParams).promise();

    // Create a new trip
    const tripId = uuidv4();
    const startTime = new Date().toISOString();
    const tripParams = {
      TableName: process.env.TRIP_TABLE,
      Item: {
        TripId: tripId,
        UserId: userId,
        ScooterId: scooterId,
        StartTime: startTime,
        Status: 'ACTIVE'
      }
    };

    await dynamodb.put(tripParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Trip started successfully',
        tripId: tripId,
        startTime: startTime,
        scooter: scooterData.Attributes
      })
    };
  } catch (error) {
    console.error('Error starting trip:', error);
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Scooter is not available' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error starting trip' })
    };
  }
}

async function endTrip(body) {
  const { tripId, endLatitude, endLongitude } = body;

  if (!tripId || !endLatitude || !endLongitude) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters' })
    };
  }

  try {
    // Get and update the trip
    const tripParams = {
      TableName: process.env.TRIP_TABLE,
      Key: { TripId: tripId },
      ConditionExpression: '#status = :active',
      UpdateExpression: 'SET #status = :completed, EndTime = :endTime, EndLatitude = :endLat, EndLongitude = :endLon',
      ExpressionAttributeNames: {
        '#status': 'Status'
      },
      ExpressionAttributeValues: {
        ':active': 'ACTIVE',
        ':completed': 'COMPLETED',
        ':endTime': new Date().toISOString(),
        ':endLat': endLatitude,
        ':endLon': endLongitude
      },
      ReturnValues: 'ALL_NEW'
    };

    const updatedTrip = await dynamodb.update(tripParams).promise();

    // Update scooter status to available
    const scooterParams = {
      TableName: process.env.FLEET_TABLE,
      Key: { ScooterId: updatedTrip.Attributes.ScooterId },
      UpdateExpression: 'SET #status = :available',
      ExpressionAttributeNames: {
        '#status': 'Status'
      },
      ExpressionAttributeValues: {
        ':available': 'AVAILABLE'
      }
    };

    await dynamodb.update(scooterParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Trip ended successfully',
        trip: updatedTrip.Attributes
      })
    };
  } catch (error) {
    console.error('Error ending trip:', error);
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Trip is not active or does not exist' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error ending trip' })
    };
  }
}
