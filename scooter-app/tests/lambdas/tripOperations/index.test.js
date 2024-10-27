// tests/lambdas/tripOperations/index.test.js

const AWS = require('aws-sdk-mock');
const { handler } = require('../../../src/lambdas/tripOperations');

describe('TripOperations Lambda', () => {
  beforeEach(() => {
    AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
      callback(null, { Item: params.Item });
    });
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  test('should create a new trip', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        startLocation: 'A',
        endLocation: 'B'
      })
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('tripId');
    expect(body.userId).toBe('user1');
  });

  test('should handle invalid input', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: 'user1'
        // Missing required fields
      })
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid input');
  });
});
const { handler } = require('../../../src/lambdas/tripOperations');

describe('tripOperations Lambda', () => {
  test('should be defined', () => {
    expect(handler).toBeDefined();
  });

  // Add more tests here
});
