const redis = require('redis');
const { promisify } = require('util');

let redisClient;

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

exports.getAsync = async (key) => {
  const client = connectToRedis();
  const getAsync = promisify(client.get).bind(client);
  return await getAsync(key);
};

exports.setAsync = async (key, value) => {
  const client = connectToRedis();
  const setAsync = promisify(client.set).bind(client);
  return await setAsync(key, value);
};

exports.zaddAsync = async (key, score, member) => {
  const client = connectToRedis();
  const zaddAsync = promisify(client.zadd).bind(client);
  return await zaddAsync(key, score, member);
};

exports.zrevrangeAsync = async (key, start, stop, withScores) => {
  const client = connectToRedis();
  const zrevrangeAsync = promisify(client.zrevrange).bind(client);
  return await zrevrangeAsync(key, start, stop, withScores);
};

exports.zrevrankAsync = async (key, member) => {
  const client = connectToRedis();
  const zrevrankAsync = promisify(client.zrevrank).bind(client);
  return await zrevrankAsync(key, member);
};

exports.zscoreAsync = async (key, member) => {
  const client = connectToRedis();
  const zscoreAsync = promisify(client.zscore).bind(client);
  return await zscoreAsync(key, member);
};