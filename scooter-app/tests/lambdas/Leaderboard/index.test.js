// tests/lambdas/leaderboard/index.test.js

const AWS = require('aws-sdk-mock');
const { handler } = require('../../../src/lambdas/leaderboard');

describe('Leaderboard Lambda', () => {
  beforeEach(() => {
    AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, {
        Items: [
          { userId: 'user1', totalDistance: 100 },
          { userId: 'user2', totalDistance: 150 },
          { userId: 'user3', totalDistance: 75 }
        ]
      });
    });

    AWS.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
      callback(null, { Attributes: params.ExpressionAttributeValues });
    });
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  test('should get leaderboard', async () => {
    const event = {
      httpMethod: 'GET'
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(3);
    expect(body[0]).toHaveProperty('userId', 'user2');
    expect(body[0]).toHaveProperty('totalDistance', 150);
  });

  test('should update leaderboard', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: 'user1',
        distance: 50
      })
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Leaderboard updated successfully');
  });

  test('should handle invalid input for update', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: 'user1'
        // Missing distance
      })
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid input');
  });

  test('should handle unsupported HTTP method', async () => {
    const event = {
      httpMethod: 'PUT'
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(405);
    expect(JSON.parse(result.body).message).toBe('Method not allowed');
  });
});
