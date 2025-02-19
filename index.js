const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION
});

// Helper function to invoke Lambda functions
const invokeLambda = async (FunctionName, Payload) => {
  const params = {
    FunctionName,
    Payload: JSON.stringify(Payload)
  };
  const result = await lambda.invoke(params).promise();
  return JSON.parse(result.Payload);
};

// Route to handle leaderboard updates
app.post('/leaderboard/update', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-Leaderboard`, {
      httpMethod: 'POST',
      path: '/leaderboard/update',
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to get top riders
app.get('/leaderboard/top-riders', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-Leaderboard`, {
      httpMethod: 'GET',
      path: '/leaderboard/top-riders',
      queryStringParameters: req.query
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error getting top riders:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to get user rank
app.get('/leaderboard/rank', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-Leaderboard`, {
      httpMethod: 'GET',
      path: '/leaderboard/rank',
      queryStringParameters: req.query
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to start a trip
app.post('/trip/start', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-TripOperations`, {
      queryStringParameters: { operation: 'start' },
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to end a trip
app.post('/trip/end', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-TripOperations`, {
      queryStringParameters: { operation: 'end' },
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to search for scooters
app.get('/search-scooters', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-SearchScooters`, {
      httpMethod: 'GET',
      queryStringParameters: req.query
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error searching scooters:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to get user profile
app.get('/user-profile/:userId', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-UserProfiles`, {
      httpMethod: 'GET',
      pathParameters: { userId: req.params.userId }
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Route to update user profile
app.put('/user-profile/:userId', async (req, res) => {
  try {
    const result = await invokeLambda(`${process.env.ENVIRONMENT_NAME}-UserProfiles`, {
      httpMethod: 'PUT',
      pathParameters: { userId: req.params.userId },
      body: JSON.stringify(req.body)
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Scooter app listening at http://localhost:${port}`);
});