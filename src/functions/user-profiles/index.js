const { MongoClient } = require('mongodb');
const redis = require('redis');
const { promisify } = require('util');

let cachedDb = null;
let redisClient = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db(process.env.MONGODB_DB_NAME);
  cachedDb = db;
  return db;
};

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
  const { httpMethod, path, body } = event;
  const userId = event.pathParameters ? event.pathParameters.userId : null;

  try {
    const db = await connectToDatabase();
    const redisClient = connectToRedis();
    const getAsync = promisify(redisClient.get).bind(redisClient);
    const setAsync = promisify(redisClient.set).bind(redisClient);

    const users = db.collection('users');

    switch (`${httpMethod} ${path}`) {
      case 'POST /users':
        const newUser = JSON.parse(body);
        const result = await users.insertOne(newUser);
        await setAsync(`user:${result.insertedId}`, JSON.stringify(newUser));
        return { statusCode: 201, body: JSON.stringify(result.ops[0]) };

      case 'GET /users/{userId}':
        const cachedUser = await getAsync(`user:${userId}`);
        if (cachedUser) {
          return { statusCode: 200, body: cachedUser };
        }
        const user = await users.findOne({ _id: userId });
        if (user) {
          await setAsync(`user:${userId}`, JSON.stringify(user));
          return { statusCode: 200, body: JSON.stringify(user) };
        }
        return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };

      case 'PUT /users/{userId}':
        const updateData = JSON.parse(body);
        const updateResult = await users.findOneAndUpdate(
          { _id: userId },
          { $set: updateData },
          { returnOriginal: false }
        );
        if (updateResult.value) {
          await setAsync(`user:${userId}`, JSON.stringify(updateResult.value));
          return { statusCode: 200, body: JSON.stringify(updateResult.value) };
        }
        return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };

      case 'DELETE /users/{userId}':
        const deleteResult = await users.findOneAndDelete({ _id: userId });
        if (deleteResult.value) {
          await redisClient.del(`user:${userId}`);
          return { statusCode: 200, body: JSON.stringify({ message: 'User deleted' }) };
        }
        return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };

      default:
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
