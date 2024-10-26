const { handler } = require('../../../src/lambdas/userProfiles');

describe('userProfiles Lambda', () => {
  test('should be defined', () => {
    expect(handler).toBeDefined();
  });

  // Add more tests here
});
