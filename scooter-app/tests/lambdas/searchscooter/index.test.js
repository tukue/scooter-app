const { handler } = require('../../../src/lambdas/searchscooter');

describe('searchscooter Lambda', () => {
  test('should be defined', () => {
    expect(handler).toBeDefined();
  });

  // Add more tests here
});
// tests/lambdas/searchScooter/index.test.js

const AWS = require('aws-sdk-mock');
const { handler } = require('../../../src/lambdas/searchScooter');

describe('Search Scooter Lambda', () => {
  beforeEach(() => {
    AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, {
        Items: [
          { scooterId: 'scooter1', location: { lat: 40.7128, lng: -74.0060 }, battery: 80 },
          { scooterId: 'scooter2', location: { lat: 40.7129, lng: -74.0061 }, battery: 75 }
        ]
      });
    });
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  test('should return nearby scooters', async () => {
    const event = {
      queryStringParameters: {
        lat: '40.7128',
        lng: '-74.0060',
        radius: '1000'
      }
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty('scooterId');
    expect(body[0]).toHaveProperty('location');
    expect(body[0]).toHaveProperty('battery');
  });

  test('should handle invalid input', async () => {
    const event = {
      queryStringParameters: {
        lat: 'invalid',
        lng: '-74.0060',
        radius: '1000'
      }
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid input');
  });

  test('should handle no scooters found', async () => {
    AWS.remock('DynamoDB.DocumentClient', 'query', (params, callback) => {
      callback(null, { Items: [] });
    });

    const event = {
      queryStringParameters: {
        lat: '40.7128',
        lng: '-74.0060',
        radius: '1000'
      }
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('No scooters found in the given radius');
  });
});
