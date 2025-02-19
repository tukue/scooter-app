const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.getFleetById = async (scooterId) => {
  const params = {
    TableName: process.env.FLEET_TABLE,
    Key: { ScooterId: scooterId }
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

exports.updateFleetStatus = async (scooterId, status) => {
  const params = {
    TableName: process.env.FLEET_TABLE,
    Key: { ScooterId: scooterId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'Status'
    },
    ExpressionAttributeValues: {
      ':status': status
    },
    ReturnValues: 'ALL_NEW'
  };
  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

exports.createTrip = async (trip) => {
  const params = {
    TableName: process.env.TRIP_TABLE,
    Item: trip
  };
  await dynamodb.put(params).promise();
};

exports.updateTrip = async (tripId, updates) => {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  for (const [key, value] of Object.entries(updates)) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  }

  const params = {
    TableName: process.env.TRIP_TABLE,
    Key: { TripId: tripId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};