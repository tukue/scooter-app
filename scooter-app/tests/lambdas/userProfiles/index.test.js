// tests/lambdas/userProfiles/index.test.js

const { MongoClient } = require('mongodb');
const { handler } = require('../../../src/lambdas/userProfiles');

jest.mock('mongodb');

describe('UserProfiles Lambda', () => {
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn()
    };

    MongoClient.connect.mockResolvedValue({
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection)
      }),
      close: jest.fn()
    });
  });

  test('should get user profile', async () => {
    const mockUser = { _id: 'user1', name: 'John Doe', email: 'john@example.com' };
    mockCollection.findOne.mockResolvedValue(mockUser);

    const event = {
      httpMethod: 'GET',
      pathParameters: { userId: 'user1' }
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockUser);
  });

  test('should update user profile', async () => {
    mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const event = {
      httpMethod: 'PUT',
      pathParameters: { userId: 'user1' },
      body: JSON.stringify({ name: 'Jane Doe' })
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('User profile updated successfully');
  });

  test('should handle user not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const event = {
      httpMethod: 'GET',
      pathParameters: { userId: 'nonexistent' }
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('User not found');
  });
});
